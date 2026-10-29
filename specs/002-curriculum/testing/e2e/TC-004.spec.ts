import { test, expect } from '@playwright/test';
import { asGv, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-1.5] TC-004 thiếu cấp độ HSK, mô tả quá 2000 ký tự', async ({ page }) => {
  const name = `TC-004 ${uid()}`;
  await asGv(page);
  await page.goto('/gv/giao-trinh');
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await dlg.getByLabel('Tên').fill(name);
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(dlg.getByText('Vui lòng chọn cấp độ HSK', { exact: true })).toBeVisible();

  await dlg.getByRole('button', { name: 'HSK3', exact: true }).click();
  await dlg.getByLabel('Mô tả').fill('m'.repeat(2001));
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(dlg.getByText('Mô tả tối đa 2000 ký tự', { exact: true })).toBeVisible();
  await shot(page, 'TC-004', 1);

  const list = await page.request.get(`/api/curricula?q=${encodeURIComponent(name)}`).then((r) => r.json());
  expect(list.total).toBe(0);
});
