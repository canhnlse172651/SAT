import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, saveItem, set, setBlock } from './helpers';

test('[005:AC-2.5] TC-019 at most 100 questions per set', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = (k: number) => mcq(`Câu ${k}?`, [{ text: 'A', correct: true }, { text: 'B' }]);
  const id = await draftSet(page, les.id, 'Bộ 100 câu', set(Array.from({ length: 100 }, (_, k) => q(k + 1))));

  // 1. T09, "Thêm câu hỏi".
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await expect(block.getByText('100 câu · Tổng điểm')).toBeVisible();
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Trắc nghiệm', exact: true }).click();
  await expect(block.getByText('Mỗi bộ bài tập có tối đa 100 câu hỏi')).toBeVisible();
  await expect(block.getByRole('region', { name: /^Câu \d+$/ })).toHaveCount(100);
  await evidence(page, 'TC-019');
  // 2. The API refuses 101 questions.
  const r = await saveItem(page, les.id, id, 'Bộ 100 câu', set(Array.from({ length: 101 }, (_, k) => q(k + 1))));
  expect(r.status, JSON.stringify(r.body)).toBe(422);
  expect((await itemOf(page, les.id, id)).content.questions).toHaveLength(100);
});
