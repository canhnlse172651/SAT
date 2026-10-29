import { test, expect } from '@playwright/test';
import {
  apiAs,
  createClass,
  ddmmyyyy,
  hvSave,
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

test('[003:AC-10.1] [003:AC-10.6] [003:AC-14.4] TC-035 kết thúc lớp: nhãn, ngày kết thúc, HV chỉ xem lại', async ({
  page,
  browser,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-035 GT', [{ name: 'Bài 1', steps: 1, sets: 2 }]);
  const hv = await newStudent(gv, 'Khoa Xong', { activate: true });
  const name = 'TC-035 Lớp';
  const cls = await createClass(gv, { name, curriculumId: cur.id, studentIds: [hv.id] });
  const [x, y] = cur.lessons[0]!.sets as [string, string];
  await setDeadline(gv, cls.id, x, vnDay());
  await setDeadline(gv, cls.id, y, vnDay());
  const hvApi = await apiAs('HV', hv.id);
  expect((await hvSubmit(hvApi, cls.id, x, 1, 1)).status).toBe(200);

  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await page.getByRole('button', { name: 'Kết thúc lớp' }).click();
  await expect(
    page.getByText(
      `Kết thúc lớp ${name}? Học viên sẽ chỉ xem lại được bài học và kết quả, không thể làm bài tập mới. Bạn có thể mở lại lớp sau.`,
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Kết thúc lớp' }).click();
  await expect(page.getByText('Đã kết thúc lớp', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: new RegExp(name) })).toContainText('Đã kết thúc');
  await expect(page.getByRole('tabpanel')).toContainText(`Ngày kết thúc${ddmmyyyy(vnDay())}`);
  await shot(page, 'TC-035', 1);

  const banner = `Lớp đã kết thúc ngày ${ddmmyyyy(vnDay())}. Bạn có thể xem lại bài học và kết quả, nhưng không thể làm bài mới.`;
  const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hvPage = await hvCtx.newPage();
  await signIn(hvPage, 'HV', hv.id);
  await hvPage.goto(`/hv/lop/${cls.id}`);
  await expect(hvPage.getByText(banner, { exact: true })).toBeVisible();
  await hvPage.getByRole('link', { name: /Bài 1/ }).click();
  await expect(hvPage.getByText(banner, { exact: true })).toBeVisible();
  await hvPage.getByRole('tab', { name: /Bài học/ }).click();
  await hvPage.getByRole('link', { name: /Bước 1/ }).click();
  await expect(hvPage).toHaveURL(new RegExp(`/hv/lop/${cls.id}/buoc/${cur.lessons[0]!.steps[0]}$`));
  await hvPage.goBack();
  await hvPage.getByRole('tab', { name: /Bài tập/ }).click();
  await hvPage.getByRole('link', { name: /Bộ 1/ }).click();
  await expect(hvPage).toHaveURL(new RegExp(`/bai-tap/${x}/ket-qua$`));
  await shot(hvPage, 'TC-035', 2);
  const r = await hvSave(hvApi, cls.id, y);
  expect(r.status).toBe(409);
  expect(r.body.error.message).toBe('Lớp đã kết thúc — không thể làm bài mới');

  // AC-10.6: no end-date field anywhere.
  await page.goto('/gv/lop-hoc/tao-moi');
  await expect(page.getByLabel(/Ngày kết thúc/)).toHaveCount(0);
  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await page.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
  await expect(page.getByRole('dialog', { name: 'Sửa thông tin lớp' }).getByLabel(/Ngày kết thúc/)).toHaveCount(0);
});
