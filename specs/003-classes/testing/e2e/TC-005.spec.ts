import { test, expect } from '@playwright/test';
import { shot, signIn } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-2.1] TC-005 các trường bước 1 và giới hạn ký tự', async ({ page }) => {
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await expect(page.getByLabel('Tên lớp')).toHaveAttribute('required', '');
  const date = page.getByLabel('Ngày bắt đầu');
  await expect(date).toHaveAttribute('required', '');
  await expect(date).toHaveValue('');
  await expect(date).toHaveAttribute('placeholder', 'dd/MM/yyyy');
  await expect(page.getByRole('button', { name: 'Chọn ngày' })).toBeVisible();
  await page.getByLabel('Mô tả').fill('m'.repeat(600));
  await page.getByLabel('Lịch học').fill('l'.repeat(250));
  await expect(page.getByLabel('Mô tả')).toHaveValue('m'.repeat(500));
  await expect(page.getByLabel('Lịch học')).toHaveValue('l'.repeat(200));
  await expect(page.getByText('500/500', { exact: true })).toBeVisible();
  await expect(page.getByText('200/200', { exact: true })).toBeVisible();
  await shot(page, 'TC-005', 1);
});
