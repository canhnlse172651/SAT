import { test, expect } from '@playwright/test';
import { createClass, ddmmyyyy, newStudent, newWorkspaceGv, seedCurriculum, shot, signIn, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-8.2] [003:AC-8.3] TC-028 Thêm học viên: Đã trong lớp, Thêm (2), HV thấy lớp', async ({ page, browser }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-028 GT', [{ name: 'Bài 1', steps: 1 }]);
  const a = await newStudent(gv, 'Hà Một', { activate: true });
  const b = await newStudent(gv, 'Hà Hai', { activate: true });
  const c = await newStudent(gv, 'Hà Ba', { activate: true });
  const cls = await createClass(gv, { name: 'TC-028 Lớp', curriculumId: cur.id, studentIds: [a.id] });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=hoc-vien`);

  await page.getByRole('tabpanel').getByRole('button', { name: 'Thêm học viên' }).click();
  const dlg = page.getByRole('dialog', { name: 'Thêm học viên' });
  await expect(dlg.getByLabel('Tìm học viên')).toBeVisible();
  await expect(dlg.getByRole('button', { name: 'Tạo học viên mới' })).toBeVisible();
  const list = dlg.getByRole('group', { name: 'Học viên trong workspace' });
  await expect(list.getByRole('checkbox', { name: 'Hà Một' })).toBeDisabled();
  await expect(list.locator('.cls-pick-row').filter({ hasText: 'Hà Một' })).toContainText('Đã trong lớp');
  await list.getByRole('checkbox', { name: 'Hà Hai' }).check();
  await list.getByRole('checkbox', { name: 'Hà Ba' }).check();
  await shot(page, 'TC-028', 1);
  await dlg.getByRole('button', { name: 'Thêm (2)' }).click();
  await expect(page.getByText('Đã thêm 2 học viên vào lớp', { exact: true })).toBeVisible();
  await expect(page.getByRole('tabpanel').getByText('Sĩ số 3/100', { exact: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Hà Hai' })).toContainText(ddmmyyyy(vnDay()));
  await shot(page, 'TC-028', 2);

  const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hvPage = await hvCtx.newPage();
  await signIn(hvPage, 'HV', b.id);
  await hvPage.goto('/hv');
  await expect(hvPage.getByRole('link', { name: /TC-028 Lớp/ })).toBeVisible();
  void c;
});
