import { expect, test } from '@playwright/test';
import { T10, T22_NEW, evidence, gvPage, uid } from './helpers';

test('[006:AC-2.1] TC-007 "Tạo bài thi" opens an unsaved exam; it is created as Nháp on the first save', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const t = uid();
  await page.goto(T10);
  await page.getByRole('button', { name: 'Tạo bài thi' }).first().click();
  await expect(page).toHaveURL(new RegExp(`${T22_NEW}$`));
  await expect(page.getByLabel('Tên bài thi')).toHaveValue('');
  await expect(page.getByLabel('Hướng dẫn (tùy chọn)')).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Chưa có câu hỏi' })).toBeVisible();
  await expect(page.getByText('Chưa chọn lớp nào')).toBeVisible();
  await expect(page.getByLabel('Giờ mở')).toHaveValue('');
  await expect(page.getByLabel('Thời lượng (phút)')).toHaveValue('');
  await expect(page.getByLabel('Giờ đóng')).toHaveValue('');
  const before = (await page.request.get('/api/exams').then((r) => r.json())).items.length;

  // 2. Back without saving: nothing created.
  await page.getByRole('button', { name: 'Về danh sách bài thi' }).click();
  await expect(page).toHaveURL(new RegExp(`${T10}$`));
  expect((await page.request.get('/api/exams').then((r) => r.json())).items.length).toBe(before);

  // 3. A name, "Lưu nháp" → a Nháp exam.
  await page.getByRole('button', { name: 'Tạo bài thi' }).first().click();
  await page.getByLabel('Tên bài thi').fill(`TC-007 Đề ${t}`);
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page).toHaveURL(/\/gv\/bai-thi\/[a-f0-9]{24}$/);
  await page.goto(T10);
  await expect(page.locator('tr', { hasText: `TC-007 Đề ${t}` })).toContainText('Nháp');
  await evidence(page, 'TC-007');
});
