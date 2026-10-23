import { test, expect } from '@playwright/test';
import {
  apiAs,
  createClass,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  ok,
  seedCurriculum,
  setDeadline,
  shot,
  signIn,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-8.5] [003:AC-8.6] TC-030 gỡ HV khỏi lớp, dữ liệu giữ lại và hiện lại khi thêm lại', async ({
  page,
  browser,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-030 GT', [{ name: 'Bài 1', steps: 1, sets: 1, questions: 4 }]);
  const hv = await newStudent(gv, 'Lan Gỡ', { activate: true });
  const a = await createClass(gv, { name: 'TC-030 Lớp A', curriculumId: cur.id, studentIds: [hv.id] });
  await createClass(gv, { name: 'TC-030 Lớp B', curriculumId: cur.id, studentIds: [hv.id] });
  const setId = cur.lessons[0]!.sets[0]!;
  await setDeadline(gv, a.id, setId, vnDay());
  const hvApi = await apiAs('HV', hv.id);
  expect((await hvSubmit(hvApi, a.id, setId, 3, 4)).status).toBe(200);

  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${a.id}?tab=hoc-vien`);
  await page.getByRole('button', { name: 'Gỡ khỏi lớp: Lan Gỡ' }).click();
  await expect(
    page.getByText('Gỡ Lan Gỡ khỏi lớp TC-030 Lớp A? Học viên sẽ không còn thấy lớp này.', { exact: true }),
  ).toBeVisible();
  await shot(page, 'TC-030', 1);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Gỡ khỏi lớp' }).click();
  await expect(page.getByText('Lớp chưa có học viên.', { exact: true })).toBeVisible();
  await expect(page.locator('.page-sub')).toContainText('Sĩ số 0/100');

  const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hvPage = await hvCtx.newPage();
  await signIn(hvPage, 'HV', hv.id);
  await hvPage.goto('/hv');
  await expect(hvPage.getByRole('link', { name: /TC-030 Lớp B/ })).toBeVisible();
  await expect(hvPage.getByRole('link', { name: /TC-030 Lớp A/ })).toHaveCount(0);
  expect((await ok(gv, 'GET', `/students/${hv.id}`)).status).toBe('active');
  await shot(hvPage, 'TC-030', 2);

  await ok(gv, 'POST', `/classes/${a.id}/students`, { studentIds: [hv.id] });
  await hvPage.goto(`/hv/lop/${a.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  await expect(hvPage.getByText('Đã hoàn thành · 3/4', { exact: true })).toBeVisible();
  await shot(hvPage, 'TC-030', 3);
});
