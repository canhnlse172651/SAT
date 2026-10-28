/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { api, contentOf, e3Answers, examBody, hvApi, minuteOf, MIN, pool, rawCall, serverNow, uid, e3, workspaceWithStudentsQuick } from './helpers';

test('[006:NFR-3] TC-111 50 attempts with retries, two devices and double submits: nothing saved is lost, nothing doubled', async ({ browser }) => {
  test.setTimeout(600_000);
  const ws = await workspaceWithStudentsQuick(browser, 50);
  const gv = ws.page;
  const cur = await api<any>(gv, 'POST', '/api/curricula', { name: `TC-111 ${uid()}`, hsk: 1 });
  const today = new Date((await serverNow(gv)).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
  const cls = await api<any>(gv, 'POST', '/api/classes', { name: `TC-111 ${uid()}`, startDate: today, curriculumId: cur.id, studentIds: ws.students, createKey: `qa-${uid()}` });
  const opensAt = minuteOf(await serverNow(gv));
  const content = e3();
  const d = await api<any>(gv, 'POST', '/api/exams', examBody({ name: `TC-111 ${uid()}`, content, classIds: [cls.id], opensAt: null, dur: null, closesAt: null }));
  const ex = await api<any>(gv, 'POST', `/api/exams/${d.id}/schedule`, {
    expectedVersion: d.version,
    ...examBody({ name: d.name, content, classIds: [cls.id], opensAt, dur: 45, closesAt: new Date(opensAt.getTime() + 60 * MIN) }),
  });
  const stored = await contentOf(gv, ex.id);
  const all = e3Answers(stored);
  const ids = stored.questions.map((q: any) => q.id);

  const outcome = await pool(ws.students, 10, async (sid, k) => {
    const dev1 = await hvApi(sid);
    const dev2 = await hvApi(sid);
    const h1 = `a${uid()}xxxxxxxx`.slice(0, 40);
    const h2 = `b${uid()}xxxxxxxx`.slice(0, 40);
    // Two devices press "Bắt đầu làm bài" at once.
    const [s1, s2] = await Promise.all([
      rawCall(dev1, 'POST', `/api/learn/exams/${ex.id}/start`, { holder: h1 }),
      rawCall(dev2, 'POST', `/api/learn/exams/${ex.id}/start`, { holder: h2 }),
    ]);
    const same = s1.body.startedAt === s2.body.startedAt;
    // The device that holds the attempt saves q1 and q2 (one save repeated = a retry after a lost answer).
    const c = await rawCall(dev1, 'GET', `/api/learn/exams/${ex.id}/clock`);
    const [holder, dev] = c.body.holder === h1 ? [h1, dev1] : [h2, dev2];
    const saved = [ids[0], ids[1]];
    for (const q of saved) {
      await rawCall(dev, 'PUT', `/api/learn/exams/${ex.id}/attempt`, { holder, answers: { [q]: all[q] } });
      await rawCall(dev, 'PUT', `/api/learn/exams/${ex.id}/attempt`, { holder, answers: { [q]: all[q] } });
    }
    // A reload (open again) then "Nộp bài" twice at once.
    const h3 = `c${uid()}xxxxxxxx`.slice(0, 40);
    await rawCall(dev, 'POST', `/api/learn/exams/${ex.id}/open`, { holder: h3 });
    const key = `k${uid()}xxxxxxxx`;
    const subs = await Promise.all([
      rawCall(dev, 'POST', `/api/learn/exams/${ex.id}/submit`, { holder: h3, submitKey: key, answers: {} }),
      rawCall(dev, 'POST', `/api/learn/exams/${ex.id}/submit`, { holder: h3, submitKey: key, answers: {} }),
    ]);
    await dev1.dispose();
    await dev2.dispose();
    return { same, subs: subs.map((s) => s.status), k };
  });
  expect(outcome.every((o) => o.same)).toBe(true);
  // One of the two simultaneous submits records the submission; the other answers with it (200) or says it is
  // already submitted (409) — never a second submission.
  const codes = outcome.flatMap((o) => o.subs);
  expect(codes.every((s) => s === 200 || s === 409), JSON.stringify(codes)).toBe(true);
  expect(outcome.every((o) => o.subs.includes(200))).toBe(true);
  test.info().annotations.push({ type: 'double-submit codes', description: JSON.stringify(codes.reduce((m: any, c) => ({ ...m, [c]: (m[c] ?? 0) + 1 }), {})) });
  const res = await api<any>(gv, 'GET', `/api/exams/${ex.id}/results?classId=${cls.id}`);
  expect(res.rows).toHaveLength(50);
  expect(res.rows.every((r: any) => r.kind === 'submitted' && r.percent === 75)).toBe(true); // q1 + q2 = 3 / 4
});
