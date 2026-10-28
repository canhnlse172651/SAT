import { expect, test } from '@playwright/test';
import { T10, draftExam, evidence, freshStudents, gvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-1.3] TC-003 T10 status filter and accent-insensitive search', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await draftExam(page, { name: `Kiểm tra HSK1 Giữa kỳ ${t}` });
  await scheduledExam(page, { name: `Ôn tập cuối kỳ ${t}`, classIds: [A.id], openIn: 24 * 60 });

  await page.goto(T10);
  const filters = page.getByRole('group', { name: 'Lọc theo trạng thái' });
  await filters.getByRole('button', { name: /^Nháp/ }).click();
  await page.getByRole('searchbox', { name: 'Tìm theo tên bài thi' }).fill(`GIUA KY ${t}`);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText(`Kiểm tra HSK1 Giữa kỳ ${t}`);
  await filters.getByRole('button', { name: /^Đã lên lịch/ }).click();
  await expect(page.getByText('Không có bài thi phù hợp')).toBeVisible();
  await evidence(page, 'TC-003');
});
