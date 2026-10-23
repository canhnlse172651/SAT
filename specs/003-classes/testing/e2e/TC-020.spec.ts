import { test, expect } from '@playwright/test';
import { apiAs, ok, seedCurriculum, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-5.5] [003:AC-5.6] TC-020 mất kết nối khi Tạo lớp, thử lại tạo đúng một lớp', async ({ page, context }) => {
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-020 GT ${uid()}`, [{ name: 'Bài 1', steps: 1 }]);
  const name = `TC-020 Lớp ${uid()}`;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByLabel('Tìm giáo trình').fill(cur.name);
  await page.getByRole('radio', { name: new RegExp(cur.name) }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Tạo lớp' }).click();
  await expect(
    page.getByText('Không thể tạo lớp. Vui lòng kiểm tra kết nối và thử lại.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Bước 4/4 · Xác nhận', { exact: true })).toBeVisible();
  await expect(page.locator('.cls-wiz-wide')).toContainText(name);
  await shot(page, 'TC-020', 1);

  await context.setOffline(false);
  await page.getByRole('button', { name: 'Tạo lớp' }).click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc\/[0-9a-f]{24}$/);
  const found = await ok(gv, 'GET', `/classes?status=all&q=${encodeURIComponent(name)}`);
  expect(found.total).toBe(1);
  await shot(page, 'TC-020', 2);
});
