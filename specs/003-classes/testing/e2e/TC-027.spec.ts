import { test, expect } from '@playwright/test';
import { createClass, ddmmyyyy, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signInLike, uid, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-8.1] [003:AC-8.7] [003:NFR-1] [003:NFR-6] TC-027 tab Học viên: dòng, trạng thái, sĩ số, tìm, lớp trống; 100 HV ≤ 2 giây', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-027 GT', [{ name: 'Bài 1', steps: 1 }]);
  const active = await newStudent(gv, 'An Kích Hoạt', { activate: true });
  const pending = await newStudent(gv, 'Bình Chưa');
  const failed = await newStudent(gv, 'Chi Lỗi', { activate: true, email: `chi+${uid()}@fail.invalid` });
  const locked = await newStudent(gv, 'Dũng Khóa', { lock: true });
  const cls = await createClass(gv, {
    name: 'TC-027 Lớp',
    curriculumId: cur.id,
    studentIds: [active.id, pending.id, failed.id, locked.id],
  });
  const empty = await createClass(gv, { name: 'TC-027 Trống', curriculumId: cur.id });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=hoc-vien`);

  const rows = page.getByRole('tabpanel').getByRole('row').filter({ has: page.getByRole('cell') });
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText('An Kích Hoạt');
  await expect(rows.nth(1)).toContainText('Bình Chưa');
  await expect(rows.nth(2)).toContainText('Chi Lỗi');
  await expect(rows.nth(3)).toContainText('Dũng Khóa');
  await expect(rows.nth(0)).toContainText('Đã kích hoạt');
  await expect(rows.nth(1)).toContainText('Chưa kích hoạt');
  await expect(rows.nth(2)).toContainText('Gửi email thất bại');
  await expect(rows.nth(3)).toContainText('Đã khóa');
  await expect(rows.nth(0)).toContainText(active.email);
  await expect(rows.nth(0)).toContainText(ddmmyyyy(vnDay()));
  await expect(rows.nth(0).getByRole('img', { name: 'An Kích Hoạt' })).toBeVisible();
  await expect(page.getByRole('tabpanel').getByText('Sĩ số 4/100', { exact: true })).toBeVisible();
  await page.getByLabel('Tìm học viên trong lớp').fill(failed.email);
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText('Chi Lỗi');
  await shot(page, 'TC-027', 1);

  await page.goto(`/gv/lop-hoc/${empty.id}?tab=hoc-vien`);
  await expect(page.getByText('Lớp chưa có học viên.', { exact: true })).toBeVisible();
  await expect(page.locator('.empty').getByRole('button', { name: 'Thêm học viên' })).toBeVisible();
  await page.goto('/gv/lop-hoc');
  await expect(page.getByRole('row').filter({ hasText: 'TC-027 Lớp' })).toContainText('4/100');
  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await expect(page.locator('.page-sub')).toContainText('Sĩ số 4/100');
  await shot(page, 'TC-027', 2);

  // NFR-1: a class of 100 HV.
  const ids: string[] = [];
  for (let i = 0; i < 100; i += 20)
    ids.push(
      ...(await Promise.all(
        Array.from({ length: 20 }, async (_, k) =>
          (await ok(gv, 'POST', '/students', { displayName: `Tải ${i + k}`, email: `l${i + k}+${uid()}@x.dev` })).id,
        ),
      )),
    );
  const big = await createClass(gv, { name: 'TC-027 100', curriculumId: cur.id, studentIds: ids });
  const t0 = Date.now();
  await page.goto(`/gv/lop-hoc/${big.id}?tab=hoc-vien`);
  await expect(rows).toHaveCount(100);
  const ms = Date.now() - t0;
  expect(ms).toBeLessThanOrEqual(2000);
  test.info().annotations.push({ type: 'NFR-1', description: `tab Học viên with 100 HV in ${ms} ms` });
});
