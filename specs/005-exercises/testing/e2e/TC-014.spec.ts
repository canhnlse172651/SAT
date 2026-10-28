import { expect, test } from '@playwright/test';
import { T09, b6, evidence, gvPage, newCurriculum, newLesson, publishedSet } from './helpers';

test('[005:AC-1.15] TC-014 T09 is edit-only', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedSet(page, les.id, 'Bộ B6', b6());

  // 1. Open the "Bài tập" tab at 1280 px.
  await page.goto(T09(cur.id, les.id));
  const panel = page.getByRole('tabpanel');
  await expect(panel.getByText('Câu 7 · Đọc hiểu')).toBeVisible();
  for (const name of ['Xem trước', 'Chỉnh sửa', 'Xong', 'Web', 'Mobile', 'Hiện đáp án', 'Nộp thử', 'Xem như học viên']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio', { name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText('Web / Mobile')).toHaveCount(0);
  // No question can be answered as a learner: no answer controls (S05 question view) on T09.
  await expect(page.locator('section.qv')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: /^Câu [\d.]+ · (chỗ trống \d+|chữ Hán)$/ })).toHaveCount(0);
  await expect(page.getByRole('group', { name: /ngân hàng mảnh/ })).toHaveCount(0);
  await expect(page.getByRole('group', { name: /dòng trả lời/ })).toHaveCount(0);
  await evidence(page, 'TC-014');
});
