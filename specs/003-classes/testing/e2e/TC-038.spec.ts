import { test, expect } from '@playwright/test';
import { addDays, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signIn, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-11.1] [003:AC-11.2] TC-038 xóa lớp chưa có bài nộp: tài khoản, lớp khác, giáo trình còn; dùng lại tên', async ({
  page,
  browser,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-038 GT', [{ name: 'Bài 1', steps: 1 }]);
  const hv1 = await newStudent(gv, 'Ánh Một', { activate: true });
  const hv2 = await newStudent(gv, 'Ánh Hai', { activate: true });
  const name = 'TC-038 Lớp';
  const cls = await createClass(gv, {
    name,
    curriculumId: cur.id,
    studentIds: [hv1.id, hv2.id],
    startDate: addDays(vnDay(), 5),
  });
  await createClass(gv, { name: 'TC-038 Khác', curriculumId: cur.id, studentIds: [hv1.id] });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await page.getByRole('button', { name: 'Xóa lớp' }).click();
  await expect(
    page.getByText(`Xóa lớp ${name}? Lớp có 2 học viên. Thao tác này không thể hoàn tác.`, { exact: true }),
  ).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa lớp' }).click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc$/);
  await expect(page.getByText(`Đã xóa lớp «${name}»`, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
  await shot(page, 'TC-038', 1);

  const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hvPage = await hvCtx.newPage();
  await signIn(hvPage, 'HV', hv1.id);
  await hvPage.goto('/hv');
  await expect(hvPage.getByRole('link', { name: /TC-038 Khác/ })).toBeVisible();
  await expect(hvPage.getByRole('link', { name: new RegExp(`${name}$`) })).toHaveCount(0);
  expect((await ok(gv, 'GET', `/students/${hv2.id}`)).status).toBe('active');
  expect((await ok(gv, 'GET', `/curricula/${cur.id}`)).name).toBe('TC-038 GT');
  const again = await createClass(gv, { name, curriculumId: cur.id });
  expect(again.name).toBe(name);
});
