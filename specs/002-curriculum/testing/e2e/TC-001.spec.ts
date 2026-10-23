import { test, expect } from '@playwright/test';
import { asGv, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-1.1] [002:AC-1.2] [002:AC-4.2] TC-001 tạo giáo trình mở T06 trống', async ({ page }) => {
  const name = `TC-001 Giáo trình HSK1 cơ bản ${uid()}`;
  await asGv(page);
  await page.goto('/gv/giao-trinh');
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await expect(dlg.getByLabel('Tên')).toBeVisible();
  const levels = dlg.getByRole('group', { name: /Cấp độ HSK/ }).getByRole('button');
  await expect(levels).toHaveCount(9);
  for (let i = 1; i <= 9; i++) {
    await expect(dlg.getByRole('button', { name: `HSK${i}`, exact: true })).toHaveAttribute('aria-pressed', 'false');
  }
  await expect(dlg.getByLabel('Mô tả')).toBeVisible();
  await expect(dlg.getByText('Ảnh bìa', { exact: true })).toBeVisible();
  await expect(dlg.getByRole('button', { name: 'Chọn ảnh' })).toBeVisible();
  await shot(page, 'TC-001', 1);

  await dlg.getByLabel('Tên').fill(name);
  await dlg.getByRole('button', { name: 'HSK1', exact: true }).click();
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(page.getByText('Đã tạo giáo trình', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/gv\/giao-trinh\/[0-9a-f]{24}$/);
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Giáo trình chưa có bài nào')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm bài' }).last()).toBeVisible();
  await shot(page, 'TC-001', 2);

  await page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: 'Giáo trình' }).click();
  await page.getByLabel('Tìm giáo trình').fill(name);
  await expect(page.getByRole('link', { name })).toBeVisible();
});
