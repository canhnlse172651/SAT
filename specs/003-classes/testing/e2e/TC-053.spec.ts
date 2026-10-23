import { test, expect } from '@playwright/test';
import {
  apiAs,
  call,
  createClass,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  seedCurriculum,
  setDeadline,
  shot,
  signIn,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-16.1] [003:AC-16.2] [003:AC-17.4] [003:AC-17.6] TC-053 ẩn / hiện Bài tập của Bài 2 chỉ trong lớp A', async ({
  page,
  browser,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-053 GT', [
    { name: 'Bài 1', steps: 1, sets: 1 },
    { name: 'Bài 2', steps: 1, sets: 1, questions: 5 },
  ]);
  const hvA = await newStudent(gv, 'Sơn Lớp A', { activate: true });
  const hvB = await newStudent(gv, 'Sơn Lớp B', { activate: true });
  const a = await createClass(gv, { name: 'TC-053 A', curriculumId: cur.id, studentIds: [hvA.id] });
  const b = await createClass(gv, { name: 'TC-053 B', curriculumId: cur.id, studentIds: [hvB.id] });
  const x = cur.lessons[1]!.sets[0]!;
  await setDeadline(gv, a.id, x, vnDay());
  await setDeadline(gv, b.id, x, vnDay());
  const apiA = await apiAs('HV', hvA.id);
  expect((await hvSubmit(apiA, a.id, x, 4, 5)).status).toBe(200);

  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${a.id}?tab=noi-dung`);
  await page.getByRole('button', { name: 'Ẩn với lớp: Bài tập của Bài 2' }).click();
  await expect(
    page.getByText(
      'Ẩn «Bài tập» của «Bài 2» với lớp TC-053 A? Học viên của lớp này sẽ không còn thấy phần này, kể cả kết quả đã làm. Điểm xếp hạng đã có được giữ nguyên. Các lớp khác dùng giáo trình này không bị ảnh hưởng. Bạn có thể hiện lại bất cứ lúc nào.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(page.getByText('Đã ẩn «Bài tập» của «Bài 2» với lớp', { exact: true })).toBeVisible();
  const row2 = page.getByRole('tabpanel').getByRole('row').filter({ hasText: 'Bài 2' });
  await expect(row2.getByText('Đang ẩn', { exact: true })).toBeVisible();
  await expect(page.getByText('2 bài · 1 phần đang ẩn với lớp này', { exact: true })).toBeVisible();
  await shot(page, 'TC-053', 1);

  const hvPage = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await signIn(hvPage, 'HV', hvA.id);
  await hvPage.goto(`/hv/lop/${a.id}`);
  const bai2 = hvPage.locator('.hv-list a.hv-row').filter({ hasText: 'Bài 2' });
  await expect(bai2.locator('.hv-row__chips')).not.toContainText('Bài tập');
  await expect(bai2).not.toContainText('bộ bài tập');
  await expect(hvPage.locator('.hv-card')).not.toContainText('1/');
  await hvPage.goto(`/hv/lop/${a.id}/bai/${cur.lessons[1]!.id}`);
  await expect(hvPage.getByRole('tab', { name: /Bài tập/ })).toHaveCount(0);
  await expect(hvPage.getByText(/Đã hoàn thành/)).toHaveCount(0);
  // S06 (005) reads the set through 003: not visible → A05.
  expect((await call(apiA, 'GET', `/my-classes/${a.id}/items/${x}`)).status).toBe(404);
  await shot(hvPage, 'TC-053', 2);
  const apiB = await apiAs('HV', hvB.id);
  expect((await call(apiB, 'GET', `/my-classes/${b.id}/lessons/${cur.lessons[1]!.id}`)).body.sets).toHaveLength(1);

  await page.getByRole('button', { name: 'Hiện với lớp: Bài tập của Bài 2' }).click();
  await expect(
    page.getByText(
      'Hiện lại «Bài tập» của «Bài 2» với lớp TC-053 A? Học viên sẽ thấy lại phần này cùng toàn bộ kết quả đã làm trước đây.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Hiện với lớp' }).click();
  await expect(page.getByText('Đã hiện «Bài tập» của «Bài 2» với lớp', { exact: true })).toBeVisible();
  await hvPage.goto(`/hv/lop/${a.id}/bai/${cur.lessons[1]!.id}?tab=bai-tap`);
  await expect(hvPage.getByText('Đã hoàn thành · 4/5', { exact: true })).toBeVisible();
  await expect(hvPage.locator('.hv-unit-head')).toContainText('1/1 bộ bài tập');
  expect((await call(apiA, 'GET', `/my-classes/${a.id}/items/${x}`)).status).toBe(200);
  await hvPage.getByRole('link', { name: /Bài 2 · Bộ 1/ }).click();
  await expect(hvPage).toHaveURL(new RegExp(`/bai-tap/${x}/ket-qua$`));
  await shot(hvPage, 'TC-053', 3);
});
