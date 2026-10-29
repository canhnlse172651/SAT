import { test, expect } from '@playwright/test';
import { addDays, apiAs, ddmmyyyy, seedCurriculum, shot, signIn, uid, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-5.1] [003:AC-5.2] TC-017 bước 4: tóm tắt, Sửa từng phần, cảnh báo còn hiệu lực', async ({ page }) => {
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-017 GT ${uid()}`, [{ name: 'Bài 1', steps: 1, draft: true }], 3);
  const name = `TC-017 Lớp ${uid()}`;
  const start = addDays(vnDay(), 5);
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  await page.getByLabel('Ngày bắt đầu').fill(ddmmyyyy(start));
  await page.getByLabel('Ngày bắt đầu').blur();
  await page.getByLabel('Mô tả').fill('Lớp ôn HSK3');
  await page.getByLabel('Lịch học').fill('Thứ 2, 4, 6 — 19:00–20:30');
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByLabel('Tìm giáo trình').fill(cur.name);
  await page.getByRole('radio', { name: new RegExp(cur.name) }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  await expect(page.getByText('Bước 4/4 · Xác nhận', { exact: true })).toBeVisible();
  const body = page.locator('.cls-wiz-wide');
  await expect(body).toContainText(name);
  await expect(body).toContainText(ddmmyyyy(start));
  await expect(body).toContainText('Sắp bắt đầu');
  await expect(body).toContainText('Lớp ôn HSK3');
  await expect(body).toContainText('Thứ 2, 4, 6 — 19:00–20:30');
  await expect(body).toContainText('Học viên (0)');
  await expect(body).toContainText(cur.name);
  await expect(body).toContainText('HSK3');
  await expect(body).toContainText('0 bài đã xuất bản');
  for (const part of ['Tên lớp', 'Ngày bắt đầu', 'Mô tả', 'Lịch học', 'Học viên (0)', 'Giáo trình'])
    await expect(page.getByRole('button', { name: `Sửa ${part}` })).toBeVisible();
  await expect(
    page.getByText('Lớp chưa có học viên. Bạn có thể thêm học viên sau khi tạo lớp.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Giáo trình này chưa có bài nào đã xuất bản. Học viên sẽ chưa thấy bài nào cho đến khi bạn xuất bản.',
      { exact: true },
    ),
  ).toBeVisible();
  await shot(page, 'TC-017', 1);

  await page.getByRole('button', { name: 'Sửa Học viên (0)' }).click();
  await expect(page.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByRole('radio', { name: new RegExp(cur.name) })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.locator('.cls-wiz-wide')).toContainText(name);
  await shot(page, 'TC-017', 2);
});
