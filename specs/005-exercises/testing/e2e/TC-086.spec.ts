/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classWithSets, doSet, gvPage, hvPage, mcq, review, saveAnswers, set, setContent, start, submit } from './helpers';

const DONE = 'Bài đã nộp — mỗi bộ bài tập chỉ làm một lần';

test('[005:AC-17.1] [005:AC-17.2] TC-086 one attempt only', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const qs = Array.from({ length: 10 }, (_, k) => mcq(`Câu ${k + 1}`, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]));
  const d = await classWithSets(gv, [{ title: 'Bộ 10', content: set(qs) }]);
  const setId = d.sets[0]!;
  const saved = (await setContent(gv, d.les, setId)).questions;
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await doSet(hv, d.cls, setId, Object.fromEntries(saved.map((q: any, k: number) => [q.id, { optionIds: [q.options[k < 6 ? 0 : 1].id] }])));
  expect([(await review(hv, d.cls, setId)).body.score, (await review(hv, d.cls, setId)).body.maxScore]).toEqual([6, 10]);

  const right = Object.fromEntries(saved.map((q: any) => [q.id, { optionIds: [q.options[0].id] }]));
  // 1. Start again. 2. Save. 3. Submit with a new key.
  for (const r of [await start(hv, d.cls, setId), await saveAnswers(hv, d.cls, setId, right), await submit(hv, d.cls, setId, right)]) {
    expect(r.status).toBe(409);
    expect(r.body.error.message).toBe(DONE);
  }
  const after = (await review(hv, d.cls, setId)).body;
  expect([after.score, after.maxScore]).toEqual([6, 10]);
});
