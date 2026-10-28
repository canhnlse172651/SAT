/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-6.1] [005:AC-6.2] TC-036 marking blanks, answers and points per blank', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await draftSet(page, les.id, 'Bộ điền', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Điền chỗ trống' }).click();
  const q = block.getByRole('region', { name: 'Câu 2', exact: true });
  const passage = q.getByLabel('Đoạn văn');

  // 1. "我是越南人", select "是", mark it.
  await passage.fill('我是越南人');
  await passage.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(1, 2));
  await q.getByRole('button', { name: 'Đánh dấu chỗ trống' }).click();
  await expect(passage).toHaveValue('我[[1]]越南人');
  // 2. Select "越南", mark it.
  await passage.evaluate((el: HTMLTextAreaElement) => {
    const s = el.value.indexOf('越南');
    el.setSelectionRange(s, s + 2);
  });
  await q.getByRole('button', { name: 'Đánh dấu chỗ trống' }).click();
  await expect(passage).toHaveValue('我[[1]][[2]]人');
  // Numbered in order of appearance; the first answer is the marked part.
  await expect(q.getByText('Chỗ trống 1', { exact: true })).toBeVisible();
  await expect(q.getByText('Chỗ trống 2', { exact: true })).toBeVisible();
  await expect(q.getByRole('textbox', { name: 'Chỗ trống 1 · đáp án 1' })).toHaveValue('是');
  await expect(q.getByRole('textbox', { name: 'Chỗ trống 2 · đáp án 1' })).toHaveValue('越南');
  await expect(q.getByRole('textbox', { name: 'Chỗ trống 1 · đáp án 1' })).toHaveAttribute('maxlength', '50');
  // 3. A second answer "shì" for blank 1; blank 2 worth 2 points.
  const blank1 = q.getByRole('group', { name: 'Chỗ trống 1' });
  await blank1.getByRole('button', { name: 'Thêm đáp án' }).click();
  await q.getByRole('textbox', { name: 'Chỗ trống 1 · đáp án 2' }).fill('shì');
  await q.getByRole('textbox', { name: 'Điểm chỗ trống 2' }).fill('2');
  await expect(q.getByText('Câu 2 · Điền chỗ trống')).toBeVisible();
  await expect(q.getByText('3 điểm', { exact: true })).toBeVisible();
  // 1–10 answers per blank.
  for (let k = 0; k < 8; k++) await blank1.getByRole('button', { name: 'Thêm đáp án' }).click();
  await expect(blank1.getByRole('textbox', { name: /^Chỗ trống 1 · đáp án \d+$/ })).toHaveCount(10);
  await expect(blank1.getByRole('button', { name: 'Thêm đáp án' })).toBeDisabled();
  for (let k = 10; k > 2; k--) await blank1.getByRole('button', { name: `Xóa đáp án ${k} của chỗ trống 1` }).click();
  await expect(blank1.getByRole('button', { name: 'Xóa đáp án 1 của chỗ trống 1' })).toBeEnabled();
  await evidence(page, 'TC-036');
  await block.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(block.getByText(/^Đã lưu lúc/)).toBeVisible();
  const saved = (await itemOf(page, les.id, id)).content.questions[1];
  expect(saved.blanks.map((b: any) => [b.answers, b.points])).toEqual([
    [['是', 'shì'], 1],
    [['越南'], 2],
  ]);
});
