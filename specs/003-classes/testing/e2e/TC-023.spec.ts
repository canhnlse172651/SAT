import { test, expect } from '@playwright/test';
import { newWorkspaceGv, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-6.4] TC-023 T02 khi GV chưa có lớp nào', async ({ page }) => {
  const gv = await newWorkspaceGv();
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc');
  await expect(
    page.getByText('Bạn chưa có lớp nào. Tạo lớp đầu tiên để bắt đầu giảng dạy.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.empty').getByRole('button', { name: 'Tạo lớp' })).toBeVisible();
  await shot(page, 'TC-023', 1);
});
