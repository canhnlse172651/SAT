/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { type Page, expect, test } from '@playwright/test';
import { hvApi, p95, pool, rawCall, workspaceWithStudents } from '../../../005-exercises/testing/e2e/helpers';
import { DAY, ORIGIN, S09, T04_RANK, advanceClock, api, exam, hvPage, mcq, relogin, settle, useClockReset, vnDay, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

const LESSONS_N = 30;
const SETS_PER_LESSON = 10;
const EXAMS_N = 50;
const RUNS = 20;

test('[008:NFR-2] [008:NFR-4] TC-063 100 HV, 300 sets with Hạn nộp, 50 exams: p95 full display ≤ 2 s', async ({ browser }) => {
  test.setTimeout(900_000);
  // A workspace of its own: 100 activated HV.
  const ws = await workspaceWithStudents(browser, 100);
  const gv = ws.page;
  await expect.poll(async () => (await api<any>(gv, 'GET', '/api/students')).counts.active, { timeout: 120_000 }).toBe(100);
  const gvId = (await api<any>(gv, 'GET', '/api/session')).user.id as string;
  // Curriculum: 30 published Bài × 10 published sets (1 MCQ each).
  const cur = (await api<{ id: string }>(gv, 'POST', '/api/curricula', { name: 'Tải 008', hsk: 1 })).id;
  const lessons: string[] = [];
  for (let k = 0; k < LESSONS_N; k++) lessons.push((await api<{ id: string }>(gv, 'POST', `/api/curricula/${cur}/lessons`, { name: `Bài ${k + 1}` })).id);
  const sets: string[][] = await pool(lessons, 6, async (l) => {
    const ids: string[] = [];
    for (let s = 0; s < SETS_PER_LESSON; s++) {
      const id = (await api<{ itemId: string }>(gv, 'POST', `/api/lessons/${l}/items`, { section: 'exercise' })).itemId;
      const v = (await api<any>(gv, 'GET', `/api/lessons/${l}`)).items.find((i: any) => i.id === id).version;
      await api(gv, 'POST', `/api/lessons/${l}/items/${id}/publish`, {
        expectedVersion: v,
        title: `Bộ ${s + 1}`,
        content: { instructions: '', stepId: null, questions: [mcq('你好?', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }])] },
      });
      ids.push(id);
    }
    const les = await api<any>(gv, 'GET', `/api/lessons/${l}`);
    await api(gv, 'POST', `/api/lessons/${l}/publish`, { expectedVersion: les.version, itemIds: [] });
    return ids;
  });
  const cls = (await api<{ id: string }>(gv, 'POST', '/api/classes', {
    name: 'Lớp tải 008',
    startDate: await vnDay(gv),
    curriculumId: cur,
    studentIds: ws.students,
    createKey: crypto.randomUUID(),
  })).id;
  // Hạn nộp today for all 300 sets (per Bài).
  for (const l of lessons) await api(gv, 'PUT', `/api/classes/${cls}/deadlines`, { target: { lessonId: l }, date: await vnDay(gv) });
  // 50 exams assigned to the class.
  await pool(Array.from({ length: EXAMS_N }, (_, k) => k), 5, (k) => exam(gv, [cls], { name: `Bài thi tải ${k + 1}` }));
  // Submissions: every HV, the 10 sets of Bài 1 and Bài 2 (2 000).
  const hvs = await pool(ws.students, 10, (id) => hvApi(id));
  const work = hvs.flatMap((ctx) => [...sets[0]!, ...sets[1]!].map((set, k) => ({ ctx, set, k })));
  await pool(work, 20, async ({ ctx, set, k }) => {
    const r = await rawCall(ctx, 'POST', `/api/dev/classes/${cls}/sets/${set}/submit`, { score: k % 11, maxScore: 10 });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
  });
  // +24 h: every Hạn nộp and every exam closed → 300 sets and 50 exams counted for every HV.
  await advanceClock(gv, DAY);
  await relogin(gv, 'GV', gvId);
  const hv = hvs[0]!;

  // 1. 20 × each endpoint.
  const gvCtx = gv.request;
  const gvMs: number[] = [];
  const hvMs: number[] = [];
  for (let k = 0; k < RUNS; k++) {
    let t0 = Date.now();
    const g = await gvCtx.get(`/api/classes/${cls}/ranking`, { headers: { Origin: ORIGIN } });
    await g.body();
    gvMs.push(Date.now() - t0);
    expect(g.status()).toBe(200);
    t0 = Date.now();
    const h = await rawCall(hv, 'GET', `/api/learn/ranking/${cls}`);
    hvMs.push(Date.now() - t0);
    expect(h.status).toBe(200);
    if (k === 0) expect([h.body.mine.nEx, h.body.mine.nExam]).toEqual([300, 50]);
  }

  // 2. S09 at 360 px on 4G (10 Mbps) and the T04 tab: time to full display.
  const throttle = async (page: Page) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (10e6 / 8), uploadThroughput: (5e6 / 8) });
  };
  const { page: s09 } = await hvPage(browser, ws.students[0]!, { width: 360, height: 740 });
  await throttle(s09);
  const s09Ms: number[] = [];
  for (let k = 0; k < 10; k++) {
    const t0 = Date.now();
    await s09.goto(S09);
    await expect(s09.getByRole('link', { name: 'Vị trí của tôi' })).toBeVisible({ timeout: 20_000 });
    await settle(s09);
    s09Ms.push(Date.now() - t0);
  }
  await throttle(gv);
  const t04Ms: number[] = [];
  for (let k = 0; k < 10; k++) {
    const t0 = Date.now();
    await gv.goto(T04_RANK(cls));
    await expect(gv.locator('.rk-tbl tbody tr')).toHaveCount(100, { timeout: 20_000 });
    t04Ms.push(Date.now() - t0);
  }
  const summary = `API p95: GV ${p95(gvMs)} ms, HV ${p95(hvMs)} ms; UI p95: S09 ${p95(s09Ms)} ms, T04 ${p95(t04Ms)} ms`;
  test.info().annotations.push({ type: 'timing', description: summary });
  console.log(summary);
  expect(p95(gvMs)).toBeLessThanOrEqual(2000);
  expect(p95(hvMs)).toBeLessThanOrEqual(2000);
  expect(p95(s09Ms)).toBeLessThanOrEqual(2000);
  expect(p95(t04Ms)).toBeLessThanOrEqual(2000);
});
