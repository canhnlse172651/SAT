import { test, expect } from '@playwright/test';
import { createClass, newWorkspaceGv, ok, seedCurriculum, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-16.6] TC-057 phần đã ở trạng thái đích do phiên khác', async ({ page, browser }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-057 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const cls = await createClass(gv, { name: 'TC-057 Lớp', curriculumId: cur.id });
  await signInLike(page, gv);
  const pageB = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await signInLike(pageB, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  await pageB.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);

  await page.getByRole('button', { name: 'Ẩn với lớp: Bài học của Bài 1' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(page.getByText('Đã ẩn «Bài học» của «Bài 1» với lớp', { exact: true })).toBeVisible();

  await pageB.getByRole('button', { name: 'Ẩn với lớp: Bài học của Bài 1' }).click();
  await pageB.getByRole('alertdialog').getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(pageB.getByText('Phần này đã ở trạng thái «Đang ẩn».', { exact: true })).toBeVisible();
  await expect(pageB.getByRole('button', { name: 'Hiện với lớp: Bài học của Bài 1' })).toBeVisible();
  const content = await ok(gv, 'GET', `/classes/${cls.id}/content`);
  expect(content.hiddenCount).toBe(1);
  await shot(pageB, 'TC-057', 1);
});
