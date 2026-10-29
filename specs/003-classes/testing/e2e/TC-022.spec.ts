import { test, expect } from '@playwright/test';
import { addDays, createClass, newWorkspaceGv, ok, seedCurriculum, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-6.2] [003:AC-6.3] [003:NFR-1] TC-022 T02 lọc trạng thái, tìm không dấu, 20/trang; 300 lớp ≤ 2 giây', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-022 GT', [{ name: 'Bài 1', steps: 1 }]);
  const today = vnDay();
  for (let i = 1; i <= 25; i++)
    await createClass(gv, { name: `Hán ngữ ${i}`, curriculumId: cur.id, startDate: addDays(today, -i) });
  for (let i = 1; i <= 2; i++) {
    const c = await createClass(gv, { name: `Đã xong ${i}`, curriculumId: cur.id, startDate: addDays(today, -40) });
    await ok(gv, 'POST', `/classes/${c.id}/end`);
  }
  await createClass(gv, { name: 'Sắp mở', curriculumId: cur.id, startDate: addDays(today, 3) });
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc');
  const filter = page.getByRole('group', { name: 'Lọc theo trạng thái' });
  const rows = page.getByRole('row').filter({ has: page.getByRole('link') });

  await filter.getByRole('button', { name: /^Đã kết thúc/ }).click();
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Đã kết thúc' })).toHaveCount(2);
  await filter.getByRole('button', { name: /^Sắp bắt đầu/ }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText('Sắp mở');
  await filter.getByRole('button', { name: /^Đang học/ }).click();
  await expect(rows).toHaveCount(20);
  await expect(page.getByText('25 lớp khớp · 20 lớp mỗi trang', { exact: true })).toBeVisible();
  await filter.getByRole('button', { name: /^Tất cả/ }).click();
  await expect(page.getByText('28 lớp khớp · 20 lớp mỗi trang', { exact: true })).toBeVisible();

  await page.getByLabel('Tìm theo tên lớp').fill('han ngu');
  await expect(page.getByText('25 lớp khớp · 20 lớp mỗi trang', { exact: true })).toBeVisible();
  await expect(rows).toHaveCount(20);
  await page.getByRole('navigation', { name: 'Phân trang' }).getByRole('button', { name: 'Trang 2' }).click();
  await expect(rows).toHaveCount(5);
  await shot(page, 'TC-022', 1);

  await page.getByLabel('Tìm theo tên lớp').fill('zzz');
  await expect(page.getByText('Không có lớp phù hợp', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect(filter.getByRole('button', { name: /Đang hoạt động/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Tìm theo tên lớp')).toHaveValue('');
  await expect(page.getByText('26 lớp khớp · 20 lớp mỗi trang', { exact: true })).toBeVisible();
  await shot(page, 'TC-022', 2);

  // NFR-1: a workspace with 300 classes.
  for (let i = 0; i < 272; i += 17)
    await Promise.all(
      Array.from({ length: 17 }, (_, k) =>
        createClass(gv, { name: `Lớp tải ${i + k}`, curriculumId: cur.id, startDate: addDays(today, -1) }),
      ),
    );
  expect((await ok(gv, 'GET', '/classes?status=all')).total).toBe(300);
  const t0 = Date.now();
  await page.goto('/gv/lop-hoc');
  await expect(rows).toHaveCount(20);
  const ms = Date.now() - t0;
  expect(ms).toBeLessThanOrEqual(2000);
  test.info().annotations.push({ type: 'NFR-1', description: `T02 with 300 classes shown in ${ms} ms` });
});
