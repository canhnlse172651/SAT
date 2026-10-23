import { test, expect } from '@playwright/test';
import { apiAs, seedCurriculum, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-1.3] [003:AC-1.4] TC-002 Quay lại / Back / thanh tiến trình giữ dữ liệu', async ({ page }) => {
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-002 GT ${uid()}`, [{ name: 'Bài 1', steps: 1 }]);
  const name = `TC-002 Lớp ${uid()}`;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByLabel('Mô tả').fill('Mô tả TC-002');
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('checkbox', { name: 'Học viên Một' }).check();
  await page.getByRole('checkbox', { name: 'Học viên Hai' }).check();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByLabel('Tìm giáo trình').fill(cur.name);
  await page.getByRole('radio', { name: new RegExp(cur.name) }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Bước 4/4 · Xác nhận', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByText('Bước 3/4 · Chọn giáo trình', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: new RegExp(cur.name) })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.goBack();
  await expect(page.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Học viên Một' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Học viên Hai' })).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Đã chọn (2)' })).toBeVisible();
  await shot(page, 'TC-002', 1);

  // AC-1.4: a later step is plain text on the progress bar, not a way to jump ahead.
  const steps = page.getByRole('list', { name: 'Các bước tạo lớp' });
  await expect(steps.getByRole('button', { name: /Xác nhận/ })).toHaveCount(0);
  await steps.getByText('Xác nhận').click();
  await expect(page.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();

  await steps.getByRole('button', { name: 'Quay lại bước 1: Thông tin lớp' }).click();
  await expect(page.getByText('Bước 1/4 · Thông tin lớp', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Tên lớp')).toHaveValue(name);
  await expect(page.getByLabel('Mô tả')).toHaveValue('Mô tả TC-002');
  await shot(page, 'TC-002', 2);
});
