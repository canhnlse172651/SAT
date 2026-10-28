/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  MIN, advanceClock, api, examBody, hvApi, minuteOf, pool, rawCall, resetClock, serverNow, gvPage, uid, e3,
  workspaceWithStudentsQuick,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:NFR-2] [006:NFR-9] TC-110 200 attempts ending together at the close: all automatic; every no-show recorded', async ({ browser }) => {
  test.setTimeout(600_000);
  const ws = await workspaceWithStudentsQuick(browser, 210);
  const gv = ws.page;
  const cur = await api<any>(gv, 'POST', '/api/curricula', { name: `TC-110 ${uid()}`, hsk: 1 });
  const today = new Date((await serverNow(gv)).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
  // A class holds at most 100: three classes.
  const groups = [ws.students.slice(0, 100), ws.students.slice(100, 200), ws.students.slice(200)];
  const classes = [];
  for (const g of groups)
    classes.push(
      await api<any>(gv, 'POST', '/api/classes', { name: `TC-110 ${uid()}`, startDate: today, curriculumId: cur.id, studentIds: g, createKey: `qa-${uid()}` }),
    );
  const opensAt = minuteOf(await serverNow(gv));
  const closesAt = new Date(opensAt.getTime() + 60 * MIN);
  const content = e3();
  const d = await api<any>(gv, 'POST', '/api/exams', examBody({ name: `TC-110 ${uid()}`, content, classIds: classes.map((c) => c.id), opensAt: null, dur: null, closesAt: null }));
  const ex = await api<any>(gv, 'POST', `/api/exams/${d.id}/schedule`, {
    expectedVersion: d.version,
    ...examBody({ name: d.name, content, classIds: classes.map((c) => c.id), opensAt, dur: 60, closesAt }),
  });
  // 200 attempts, all bounded by the close; 10 students never start.
  const starters = ws.students.slice(0, 200);
  const started = await pool(starters, 20, async (id) => {
    const ctx = await hvApi(id);
    const r = await rawCall(ctx, 'POST', `/api/learn/exams/${ex.id}/start`, { holder: `h${uid()}xxxxxxxx`.slice(0, 40) });
    await ctx.dispose();
    return r.status;
  });
  expect(started.every((s) => s === 200)).toBe(true);
  await advanceClock(gv, closesAt.getTime() + 15_000 - (await serverNow(gv)).getTime());
  const t0 = Date.now();
  const rows: any[] = [];
  for (const c of classes) rows.push(...(await api<any>(gv, 'GET', `/api/exams/results?classId=${c.id}`)).items);
  expect(Date.now() - t0).toBeLessThan(60_000);
  const mine = rows.filter((r) => r.examId === ex.id);
  const submitted = mine.filter((r) => r.kind === 'submitted');
  expect(submitted).toHaveLength(200);
  expect(submitted.every((r) => r.auto && r.submittedAt === closesAt.toISOString())).toBe(true);
  expect(mine.filter((r) => r.kind === 'noShow')).toHaveLength(10);
});
