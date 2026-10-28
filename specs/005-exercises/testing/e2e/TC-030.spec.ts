import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-4.2] [005:AC-4.3] [005:AC-4.4] TC-030 completeness of a multiple-choice question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('Câu?', [{ text: 'Một', correct: true }, { text: 'Hai' }, { text: 'Ba' }])]));
  await page.goto(T09(cur.id, les.id));
  const q1 = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });
  const list = q1.getByRole('list', { name: 'Câu 1 chưa hoàn chỉnh' });
  await expect(q1.getByText('Chưa hoàn chỉnh', { exact: true })).toHaveCount(0);

  // 1. Empty stem.
  await q1.getByLabel('Đề bài').fill('');
  await expect(q1.getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await expect(list).toContainText('Câu hỏi cần có đề bài (chữ hoặc hình ảnh)');
  await q1.getByLabel('Đề bài').fill('Câu?');
  // 2. One-answer mode with 2 correct (marked in multi mode, then back to one).
  await q1.getByRole('radio', { name: 'Nhiều đáp án đúng' }).click();
  await q1.getByRole('checkbox', { name: 'Đáp án đúng B' }).check();
  await q1.getByRole('radio', { name: 'Một đáp án đúng' }).click();
  await expect(list).toContainText('Hãy chọn đúng 1 đáp án đúng');
  // 3. Multi mode, none correct.
  await q1.getByRole('radio', { name: 'Nhiều đáp án đúng' }).click();
  await q1.getByRole('checkbox', { name: 'Đáp án đúng A' }).uncheck();
  await q1.getByRole('checkbox', { name: 'Đáp án đúng B' }).uncheck();
  await expect(list).toContainText('Hãy chọn ít nhất 1 đáp án đúng');
  await q1.getByRole('checkbox', { name: 'Đáp án đúng A' }).check();
  // 4. Option C empty.
  await q1.getByRole('textbox', { name: 'Phương án C' }).fill('');
  await expect(list).toContainText('Phương án C đang trống');
  await q1.getByRole('textbox', { name: 'Phương án C' }).fill('Ba');
  // 5. A and B "你好 " / "你好".
  await q1.getByRole('textbox', { name: 'Phương án A' }).fill('你好 ');
  await q1.getByRole('textbox', { name: 'Phương án B' }).fill('你好');
  await expect(list).toContainText('Phương án B trùng với phương án A');
  await expect(q1.getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await evidence(page, 'TC-030');
});
