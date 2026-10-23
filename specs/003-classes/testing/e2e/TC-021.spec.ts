import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newWorkspaceGv, ok, seedCurriculum, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-6.1] [003:AC-6.5] [003:AC-14.1] TC-021 T02 cột, lọc mặc định, thứ tự, nhãn trạng thái, mở T04', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-021 GT', [{ name: 'Bài 1', steps: 1 }], 2);
  const today = vnDay();
  await createClass(gv, { name: 'Lớp Sắp', curriculumId: cur.id, startDate: addDays(today, 5) });
  await createClass(gv, { name: 'Lớp Đang', curriculumId: cur.id, startDate: addDays(today, -3) });
  const ended = await createClass(gv, { name: 'Lớp Kết thúc', curriculumId: cur.id, startDate: addDays(today, -30) });
  await ok(gv, 'POST', `/classes/${ended.id}/end`);
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc');

  await expect(page.getByRole('button', { name: 'Tạo lớp' })).toBeVisible();
  await expect(page.getByRole('columnheader')).toHaveText(['Tên lớp', 'Trạng thái', 'Ngày bắt đầu', 'Giáo trình', 'Sĩ số', 'Ngày tạo']);
  const filter = page.getByRole('group', { name: 'Lọc theo trạng thái' });
  await expect(filter.getByRole('button', { name: /Đang hoạt động/ })).toHaveAttribute('aria-pressed', 'true');
  const rows = page.getByRole('row').filter({ has: page.getByRole('link') });
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Lớp Sắp');
  await expect(rows.nth(0)).toContainText('Sắp bắt đầu');
  await expect(rows.nth(0)).toContainText(ddmmyyyy(addDays(today, 5)));
  await expect(rows.nth(0)).toContainText('HSK2');
  await expect(rows.nth(0)).toContainText('TC-021 GT');
  await expect(rows.nth(0)).toContainText('0/100');
  await expect(rows.nth(0)).toContainText(ddmmyyyy(today));
  await expect(rows.nth(1)).toContainText('Lớp Đang');
  await expect(rows.nth(1)).toContainText('Đang học');
  await expect(page.getByText('Lớp Kết thúc')).toHaveCount(0);
  await shot(page, 'TC-021', 1);

  await rows.nth(1).click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc\/[0-9a-f]{24}$/);
  await expect(page.getByRole('heading', { name: /Lớp Đang/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
  await shot(page, 'TC-021', 2);
});
