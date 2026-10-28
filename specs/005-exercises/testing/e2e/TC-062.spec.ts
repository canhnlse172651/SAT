/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { addItem, aiPreview, getLesson, gvPage, mcq, newCurriculum, newLesson, set } from './helpers';

test('[005:AC-13.2] [005:AC-13.3] TC-062 limits and rules checked before approval', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  for (let k = 0; k < 28; k++) await addItem(gv, les.id, 'exercise');
  const before = (await getLesson(gv, les.id)).items.map((i: any) => i.id);
  const ok = (p = 'Câu?') => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  const sets = (n: number) => Array.from({ length: n }, (_, k) => ({ title: `AI ${k + 1}`, content: set([ok()]) }));

  // 1. 3 valid sets.
  const p1 = await aiPreview(gv, les.id, sets(3));
  expect(p1.status, JSON.stringify(p1.body)).toBe(200);
  // 2. 31 sets.
  const p2 = await aiPreview(gv, les.id, sets(31));
  expect(p2.status).toBeGreaterThanOrEqual(400);
  expect(p2.body.error.message).toBe('Mỗi bài có tối đa 30 bộ bài tập. Hãy xóa bớt mục trong review rồi duyệt lại.');
  // 3. 2 sets, question 3 of set 2 has 2 correct answers in one-answer mode.
  const two = mcq('Hai đúng', [{ text: 'A', correct: true }, { text: 'B', correct: true }]);
  const p3 = await aiPreview(gv, les.id, [
    { title: 'AI 1', content: set([ok()]) },
    { title: 'AI 2', content: set([ok(), ok(), two]) },
  ]);
  expect(p3.status).toBeGreaterThanOrEqual(400);
  expect(JSON.stringify(p3.body)).toContain('Câu 3');
  expect(JSON.stringify(p3.body)).toContain('Hãy chọn đúng 1 đáp án đúng');
  // The section is unchanged.
  expect((await getLesson(gv, les.id)).items.map((i: any) => i.id)).toEqual(before);
});
