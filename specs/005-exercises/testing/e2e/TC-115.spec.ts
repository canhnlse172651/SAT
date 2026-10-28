/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classWithSets, hvApi, mcq, p95, pool, rawCall, set, setContent, workspaceWithStudents } from './helpers';

test('[005:NFR-1] TC-115 100 students submit a 100-question set within a minute', async ({ browser }) => {
  test.setTimeout(600_000);
  const ws = await workspaceWithStudents(browser, 100);
  const qs = Array.from({ length: 100 }, (_, k) => mcq(`Câu ${k + 1}`, [{ text: 'Đúng', correct: true }, { text: 'Sai' }, { text: 'Không' }]));
  const d = await classWithSets(ws.page, [{ title: 'Bộ 100 câu', content: set(qs) }], { students: ws.students });
  expect(d.students).toHaveLength(100);
  const setId = d.sets[0]!;
  const saved = (await setContent(ws.page, d.les, setId)).questions;
  const answers = Object.fromEntries(saved.map((q: any, k: number) => [q.id, { optionIds: [q.options[k % 3].id] }]));
  const base = `/api/learn/classes/${d.cls}/sets/${setId}`;
  const hvs = await pool(d.students, 20, (id) => hvApi(id));
  await pool(hvs, 20, async (hv) => expect((await rawCall(hv, 'POST', `${base}/start`)).status).toBeLessThan(300));

  // 1. 100 students submit within one minute; submit + review per student.
  const t0 = Date.now();
  const times = await pool(hvs, 10, async (hv, k) => {
    const s = await rawCall(hv, 'POST', `${base}/submit`, { submitKey: `load${k}xxxxxxxxx`, answers });
    expect(s.status, JSON.stringify(s.body)).toBeLessThan(300);
    const r = await rawCall(hv, 'GET', `${base}/review`);
    expect(r.body.submitted).toBe(true);
    return s.ms + r.ms;
  });
  const total = Date.now() - t0;
  console.log(`TC-115: ${times.length} submissions in ${total} ms; submit+review p95 ${p95(times)} ms, max ${Math.max(...times)} ms`);
  expect(total).toBeLessThanOrEqual(60_000);
  expect(p95(times)).toBeLessThanOrEqual(2000);
  await Promise.all(hvs.map((h) => h.dispose()));
});
