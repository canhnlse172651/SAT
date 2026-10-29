import { test, expect } from '@playwright/test';
import { apiAs, createClass, ok, seedCurriculum, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-7.5] TC-026 lớp vừa được thay đổi ở nơi khác', async ({ page, browser }) => {
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-026 GT ${uid()}`, [{ name: 'Bài 1', steps: 1 }]);
  const cls = await createClass(gv, { name: `TC-026 Lớp ${uid()}`, curriculumId: cur.id });
  await signIn(page, 'GV');
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageB = await ctxB.newPage();
  await signIn(pageB, 'GV');

  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await page.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
  const dlgA = page.getByRole('dialog', { name: 'Sửa thông tin lớp' });
  await dlgA.getByLabel('Mô tả').fill('Mô tả của A');

  await pageB.goto(`/gv/lop-hoc/${cls.id}`);
  await pageB.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
  const dlgB = pageB.getByRole('dialog', { name: 'Sửa thông tin lớp' });
  await dlgB.getByLabel('Mô tả').fill('Mô tả của B');
  await dlgB.getByRole('button', { name: 'Lưu' }).click();
  await expect(pageB.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();

  await dlgA.getByRole('button', { name: 'Lưu' }).click();
  await expect(
    dlgA.getByText('Lớp vừa được thay đổi ở nơi khác. Vui lòng tải lại để xem thông tin mới nhất.', { exact: true }),
  ).toBeVisible();
  expect((await ok(gv, 'GET', `/classes/${cls.id}`)).description).toBe('Mô tả của B');
  await shot(page, 'TC-026', 1);
});
