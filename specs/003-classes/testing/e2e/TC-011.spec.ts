import { test, expect } from '@playwright/test';
import { shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-3.4] TC-011 T12 từ bước 2: HV mới Chưa kích hoạt và tự động được chọn', async ({ page }) => {
  const name = `TC-011 Lớp ${uid()}`;
  const a = `TC011 An ${uid()}`;
  const b = `TC011 Bình ${uid()}`;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('checkbox', { name: 'Học viên Một' }).check();

  await page.getByRole('button', { name: 'Tạo học viên mới' }).first().click();
  const t12 = page.getByRole('dialog', { name: 'Thêm học viên' });
  for (const n of [a, b]) {
    await t12.getByLabel('Họ tên').fill(n);
    await t12.getByLabel('Email').fill(`${n.replace(/\W+/g, '').toLowerCase()}${uid()}@sat.dev`);
    await t12.getByRole('button', { name: 'Thêm học viên' }).click();
    await expect(t12.getByText(n, { exact: true }).first()).toBeVisible();
  }
  // The footer button (the header also has an icon button "Đóng").
  await t12.getByRole('button', { name: 'Đóng', exact: true }).last().click();
  await expect(t12).toBeHidden();

  await expect(page.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đã chọn (3)' })).toBeVisible();
  const list = page.getByRole('group', { name: 'Học viên trong workspace' });
  await page.getByLabel('Tìm học viên').fill('TC011');
  for (const n of [a, b]) {
    await expect(list.getByRole('checkbox', { name: n })).toBeChecked();
    await expect(list.locator('.cls-pick-row').filter({ hasText: n })).toContainText('Chưa kích hoạt');
  }
  await shot(page, 'TC-011', 1);
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByLabel('Tên lớp')).toHaveValue(name);
});
