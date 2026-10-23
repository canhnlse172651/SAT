import { test, expect } from '@playwright/test';
import { loginAs } from '../../../../tests/e2e/fixtures';
import { shot } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[002:AC-17.3] TC-078 HV mở T05 bị đưa về S01', async ({ page }) => {
  await page.goto('/');
  await loginAs(page, 'HV');
  await page.goto('/gv/giao-trinh');
  await expect(page).toHaveURL(/\/hv$/);
  await expect(page.getByRole('heading', { name: 'Giáo trình' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tạo giáo trình' })).toHaveCount(0);
  await shot(page, 'TC-078', 1);
});
