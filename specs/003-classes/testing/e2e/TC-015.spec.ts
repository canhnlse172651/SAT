import { test, expect } from '@playwright/test';
import { newWorkspaceGv, seedCurriculum, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const WARN =
  'Giáo trình này chưa có bài nào đã xuất bản. Học viên sẽ chưa thấy bài nào cho đến khi bạn xuất bản.';

test('[003:AC-4.3] [003:AC-4.4] [003:AC-4.5] TC-015 chọn một giáo trình, bắt buộc, cảnh báo chưa có Bài đã xuất bản', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  await seedCurriculum(gv, 'X có bài', [{ name: 'Bài 1', steps: 1 }]);
  await seedCurriculum(gv, 'Y chưa xuất bản', [{ name: 'Bài 1', steps: 1, draft: true }]);
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-015 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Vui lòng chọn một giáo trình', { exact: true })).toBeVisible();
  await expect(page.getByText('Bước 3/4 · Chọn giáo trình', { exact: true })).toBeVisible();

  const x = page.getByRole('radio', { name: /X có bài/ });
  const y = page.getByRole('radio', { name: /Y chưa xuất bản/ });
  await x.click();
  await expect(x).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText(WARN, { exact: true })).toHaveCount(0);
  await y.click();
  await expect(y).toHaveAttribute('aria-checked', 'true');
  await expect(x).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText(WARN, { exact: true })).toBeVisible();
  await shot(page, 'TC-015', 1);
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Bước 4/4 · Xác nhận', { exact: true })).toBeVisible();
});
