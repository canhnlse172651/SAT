import { test, expect } from '@playwright/test';
import { createClass, newWorkspaceGv, ok, seedCurriculum, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const FAILED = 'Không thể cập nhật hiển thị nội dung. Vui lòng thử lại.';

test('[003:AC-16.5] TC-056 ẩn / hiện thất bại: không phần nào đổi', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-056 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }, { name: 'Bài 2', steps: 1 }]);
  const cls = await createClass(gv, { name: 'TC-056 Lớp', curriculumId: cur.id });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  const panel = page.getByRole('tabpanel');

  await ok(gv, 'POST', '/dev/classes/faults', { op: 'visibility' });
  await panel.getByRole('button', { name: 'Ẩn với lớp: Bài học của Bài 1' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(page.getByText(FAILED, { exact: true })).toBeVisible();
  await expect(panel.getByText('Đang ẩn', { exact: true })).toHaveCount(0);

  await ok(gv, 'POST', '/dev/classes/faults', { op: 'visibility' });
  await panel.getByRole('button', { name: 'Ẩn Bài học ở mọi bài' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(page.getByText(FAILED, { exact: true }).first()).toBeVisible();
  await expect(panel.getByText('Đang ẩn', { exact: true })).toHaveCount(0);
  expect((await ok(gv, 'GET', `/classes/${cls.id}/content`)).hiddenCount).toBe(0);
  await shot(page, 'TC-056', 1);
});
