import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-2.7] [005:AC-12.1] TC-022 an incomplete draft can be saved', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ nháp', set([mcq('Câu?', [{ text: 'A' }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const q1 = block.getByRole('region', { name: 'Câu 1', exact: true });

  // 1. The question is marked.
  await expect(q1.getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await expect(q1.getByRole('list', { name: 'Câu 1 chưa hoàn chỉnh' })).toContainText('Hãy chọn đúng 1 đáp án đúng');
  // 2. "Lưu nháp" saves.
  await block.getByLabel('Hướng dẫn (tùy chọn)').fill('Làm cẩn thận');
  await block.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(block.getByText(/^Đã lưu lúc \d\d:\d\d$/)).toBeVisible();
  await evidence(page, 'TC-022', 1);
  // 3. Choosing the correct answer removes the mark at once.
  await q1.getByRole('radio', { name: 'Đáp án đúng A' }).check();
  await expect(q1.getByText('Chưa hoàn chỉnh', { exact: true })).toHaveCount(0);
  await expect(q1.getByRole('list', { name: 'Câu 1 chưa hoàn chỉnh' })).toHaveCount(0);
  await evidence(page, 'TC-022', 2);
});
