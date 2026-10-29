import { test, expect } from '@playwright/test';
import { registerGv, shot } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-1.3] TC-002 tên giáo trình rỗng hoặc quá 100 ký tự', async ({ page }) => {
  // A fresh workspace, so the number of curricula is not changed by other test cases.
  await page.goto('/');
  await registerGv(page);
  await page.goto('/gv/giao-trinh');
  const before = await page.request.get('/api/curricula?archived=false').then((r) => r.json());
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await dlg.getByLabel('Tên').fill('     ');
  await dlg.getByRole('button', { name: 'HSK2', exact: true }).click();
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(dlg.getByText('Vui lòng nhập tên giáo trình', { exact: true })).toBeVisible();

  await dlg.getByLabel('Tên').fill('x'.repeat(101));
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(dlg.getByText('Tên giáo trình tối đa 100 ký tự', { exact: true })).toBeVisible();
  await shot(page, 'TC-002', 1);

  const after = await page.request.get('/api/curricula?archived=false').then((r) => r.json());
  expect(after.levelCounts.all).toBe(before.levelCounts.all);
});
