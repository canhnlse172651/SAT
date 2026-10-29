import { test, expect } from '@playwright/test';
import { asGv, createCurriculum, ok, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-1.4] TC-003 tên trùng (hoa/thường, khoảng trắng, kể cả đã lưu trữ)', async ({ page }) => {
  const u = uid();
  await asGv(page);
  const c = await createCurriculum(page, `TC-003 Hán ngữ Một ${u}`);
  await ok(page, 'POST', `/curricula/${c.id}/archive`);

  await page.goto('/gv/giao-trinh');
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await dlg.getByLabel('Tên').fill(`  tc-003   HÁN NGỮ một ${u.toUpperCase()} `);
  await dlg.getByRole('button', { name: 'HSK1', exact: true }).click();
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(dlg.getByText('Tên giáo trình đã tồn tại', { exact: true })).toBeVisible();
  await expect(dlg).toBeVisible();
  await shot(page, 'TC-003', 1);
});
