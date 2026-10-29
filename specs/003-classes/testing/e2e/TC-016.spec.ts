import { test, expect } from '@playwright/test';
import { newWorkspaceGv, ok, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-4.6] TC-016 workspace chưa có giáo trình: liên kết T05 thẻ mới, Tải lại danh sách', async ({
  page,
  context,
}) => {
  const gv = await newWorkspaceGv();
  await ok(gv, 'POST', '/students', { displayName: 'HV Một', email: `tc016${Date.now()}@sat.dev` });
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-016 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('checkbox', { name: 'HV Một' }).check();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  await expect(
    page.getByText('Bạn chưa có giáo trình nào. Hãy tạo giáo trình trước để gán cho lớp.', { exact: true }),
  ).toBeVisible();
  const link = page.getByRole('link', { name: 'Mở danh sách giáo trình' });
  await expect(link).toHaveAttribute('target', '_blank');
  await shot(page, 'TC-016', 1);
  const [tab] = await Promise.all([context.waitForEvent('page'), link.click()]);
  await tab.waitForLoadState();
  await expect(tab).toHaveURL(/\/gv\/giao-trinh$/);
  await ok(gv, 'POST', '/curricula', { name: 'GT mới TC-016', hsk: 1 });
  await tab.close();

  await page.getByRole('button', { name: 'Tải lại danh sách' }).click();
  await expect(page.getByRole('radio', { name: /GT mới TC-016/ })).toBeVisible();
  await page.getByRole('radio', { name: /GT mới TC-016/ }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('TC-016 Lớp', { exact: true })).toBeVisible();
  await expect(page.getByText('HV Một', { exact: true })).toBeVisible();
  await shot(page, 'TC-016', 2);
});
