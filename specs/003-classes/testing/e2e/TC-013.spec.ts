import { test, expect } from '@playwright/test';
import { newWorkspaceGv, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-3.6] TC-013 workspace chưa có HV', async ({ page }) => {
  const gv = await newWorkspaceGv();
  await page.goto('/');
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-013 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Bạn chưa có học viên nào.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo học viên mới' })).toBeVisible();
  await shot(page, 'TC-013', 1);
});
