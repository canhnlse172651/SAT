import { test, expect } from '@playwright/test';
import { addDays, ddmmyyyy, shot, signIn, uid, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const NOTICE = 'Lớp sẽ ở trạng thái Đang học ngay sau khi tạo — học viên có thể vào học ngay.';

test('[003:AC-2.5] [003:AC-2.6] TC-007 khoảng ngày bắt đầu và thông báo Đang học ngay', async ({ page }) => {
  const today = vnDay();
  const range = `Vui lòng chọn ngày bắt đầu từ ${ddmmyyyy(addDays(today, -365))} đến ${ddmmyyyy(addDays(today, 365))}`;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(`TC-007 Lớp ${uid()}`);
  const next = page.getByRole('button', { name: 'Tiếp tục ›' });
  const date = page.getByLabel('Ngày bắt đầu');

  await next.click();
  await expect(page.getByText(range, { exact: true })).toBeVisible();

  await date.fill(ddmmyyyy(addDays(today, 366)));
  await date.blur();
  await next.click();
  await expect(page.getByText(range, { exact: true })).toBeVisible();
  await expect(page.getByText('Bước 1/4 · Thông tin lớp', { exact: true })).toBeVisible();
  await shot(page, 'TC-007', 1);

  await date.fill(ddmmyyyy(today));
  await date.blur();
  await expect(page.getByText(NOTICE, { exact: true })).toBeVisible();
  await date.fill(ddmmyyyy(addDays(today, -10)));
  await date.blur();
  await expect(page.getByText(NOTICE, { exact: true })).toBeVisible();
  await shot(page, 'TC-007', 2);
  await next.click();
  await expect(page.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();
});
