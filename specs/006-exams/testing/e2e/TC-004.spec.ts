import { expect, test } from '@playwright/test';
import { T10, evidence, otherGvPage } from './helpers';

test('[006:AC-1.4] TC-004 empty workspace shows "Chưa có bài thi nào" with "Tạo bài thi"', async ({ browser }) => {
  const { page } = await otherGvPage(browser);
  await page.goto(T10);
  await expect(page.getByRole('heading', { name: 'Chưa có bài thi nào' })).toBeVisible();
  await expect(page.locator('.empty').getByRole('button', { name: 'Tạo bài thi' })).toBeVisible();
  await evidence(page, 'TC-004');
});
