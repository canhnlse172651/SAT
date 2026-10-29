import { test, expect } from '@playwright/test';
import { shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-1.1] [003:AC-1.2] TC-001 mở T03, bước 1/4, kiểm tra dữ liệu bước', async ({ page }) => {
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc');
  await page.getByRole('button', { name: 'Tạo lớp' }).first().click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc\/tao-moi/);
  await expect(page.getByRole('heading', { name: 'Tạo lớp mới' })).toBeVisible();
  const steps = page.getByRole('list', { name: 'Các bước tạo lớp' }).getByRole('listitem');
  await expect(steps).toHaveText([/Thông tin lớp/, /Thêm học viên/, /Chọn giáo trình/, /Xác nhận/]);
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(page.getByText('Bước 1/4 · Thông tin lớp', { exact: true })).toBeVisible();
  await shot(page, 'TC-001', 1);

  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Bước 1/4 · Thông tin lớp', { exact: true })).toBeVisible();
  await expect(page.getByText('Vui lòng nhập tên lớp', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/^Vui lòng chọn ngày bắt đầu từ \d\d\/\d\d\/\d{4} đến \d\d\/\d\d\/\d{4}$/),
  ).toBeVisible();
  await shot(page, 'TC-001', 2);

  await page.getByLabel('Tên lớp').fill(`TC-001 Lớp ${uid()}`);
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();
  await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
  await shot(page, 'TC-001', 3);
});
