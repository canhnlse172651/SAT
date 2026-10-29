import { test, expect } from '@playwright/test';
import { apiAs, ok, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const QUESTION = 'Bỏ tạo lớp? Thông tin bạn đã nhập sẽ không được lưu.';

test('[003:AC-1.5] TC-003 hỏi trước khi rời T03, Ở lại / Bỏ', async ({ page }) => {
  const gv = await apiAs('GV');
  const name = `TC-003 Lớp ${uid()}`;
  const count = async () =>
    (await ok(gv, 'GET', `/classes?status=all&q=${encodeURIComponent(name)}`)).total;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);

  await page.getByRole('button', { name: 'Hủy' }).click();
  await expect(page.getByText(QUESTION, { exact: true })).toBeVisible();
  await shot(page, 'TC-003', 1);
  await page.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page.getByText(QUESTION, { exact: true })).toBeHidden();
  await expect(page.getByLabel('Tên lớp')).toHaveValue(name);

  await page.getByRole('link', { name: 'Lớp học', exact: true }).first().click();
  await expect(page.getByText(QUESTION, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ', exact: true }).click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc$/);
  expect(await count()).toBe(0);

  await page.getByRole('button', { name: 'Tạo lớp' }).first().click();
  await page.getByLabel('Tên lớp').fill(name);
  await page.goBack();
  await expect(page.getByText(QUESTION, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ', exact: true }).click();
  await expect(page).not.toHaveURL(/tao-moi/);
  expect(await count()).toBe(0);
  await shot(page, 'TC-003', 2);
});
