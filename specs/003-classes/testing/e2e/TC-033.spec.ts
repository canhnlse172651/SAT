import { test, expect } from '@playwright/test';
import {
  addDays,
  apiAs,
  createClass,
  newStudent,
  newWorkspaceGv,
  ok,
  resetClock,
  advanceClock,
  seedCurriculum,
  setDeadline,
  setVisibility,
  shot,
  signIn,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-9.1] [003:AC-9.2] TC-033 đổi giáo trình lớp Sắp bắt đầu: đặt lại ẩn/hiện và hạn nộp', async ({
  page,
  browser,
}) => {
  const gv = await newWorkspaceGv();
  const g1 = await seedCurriculum(gv, 'G1 cũ', [{ name: 'Bài cũ', steps: 1, sets: 1 }]);
  await seedCurriculum(gv, 'G2 mới', [{ name: 'Bài mới 1', steps: 1, sets: 1 }, { name: 'Bài mới 2', steps: 1 }], 2);
  const hv = await newStudent(gv, 'Tú Đổi', { activate: true });
  const start = addDays(vnDay(), 3);
  const name = 'TC-033 Lớp';
  const cls = await createClass(gv, { name, curriculumId: g1.id, studentIds: [hv.id], startDate: start });
  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: g1.lessons[0]!.id, section: 'lesson' });
  await setDeadline(gv, cls.id, g1.lessons[0]!.sets[0]!, addDays(start, 2));
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}`);

  await page.getByRole('tabpanel').getByRole('button', { name: 'Đổi giáo trình' }).click();
  const dlg = page.getByRole('dialog', { name: 'Đổi giáo trình' });
  await expect(dlg.getByRole('group', { name: 'Lọc theo cấp HSK' })).toBeVisible();
  await expect(dlg.getByLabel('Tìm giáo trình')).toBeVisible();
  await expect(dlg.getByRole('radio', { name: /G1 cũ/ })).toContainText('Đang dùng');
  await dlg.getByRole('radio', { name: /G2 mới/ }).click();
  await shot(page, 'TC-033', 1);
  await dlg.getByRole('button', { name: 'Đổi giáo trình' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(
    confirm.getByText(
      'Đổi giáo trình của lớp TC-033 Lớp sang G2 mới? Học viên sẽ thấy các bài của giáo trình mới; tiến độ theo giáo trình cũ không còn được tính cho lớp này và thiết lập ẩn/hiện nội dung của lớp sẽ được đặt lại.',
      { exact: true },
    ),
  ).toBeVisible();
  await confirm.getByRole('button', { name: 'Đổi giáo trình' }).click();
  await expect(page.getByText('Đã đổi giáo trình', { exact: true })).toBeVisible();
  await expect(page.locator('.page-sub').getByRole('link', { name: 'G2 mới' })).toBeVisible();

  await page.getByRole('tab', { name: 'Nội dung' }).click();
  const panel = page.getByRole('tabpanel');
  await expect(panel.getByRole('link', { name: 'Bài mới 1' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Bài mới 2' })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Bài cũ' })).toHaveCount(0);
  await expect(panel.getByText('Đang ẩn', { exact: true })).toHaveCount(0);
  await expect(panel.getByText('Hiển thị', { exact: true })).toHaveCount(4);
  await expect(panel.getByRole('button', { name: /^Hạn nộp .*: chưa đặt$/ })).toHaveCount(1);
  await expect(panel.getByText('Đặt hạn', { exact: true }).first()).toBeVisible();
  await shot(page, 'TC-033', 2);

  // The HV after the start day sees the new curriculum's Bài.
  const me = await ok(gv, 'GET', '/session');
  await advanceClock(gv, 3 * 24 * 3600_000);
  try {
    const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const hvPage = await hvCtx.newPage();
    await signIn(hvPage, 'HV', hv.id);
    await hvPage.goto(`/hv/lop/${cls.id}`);
    await expect(hvPage.getByRole('link', { name: /Bài mới 1/ })).toBeVisible();
    await expect(hvPage.getByRole('link', { name: /Bài cũ/ })).toHaveCount(0);
    await shot(hvPage, 'TC-033', 3);
  } finally {
    await resetClock(await apiAs('GV', me.user.id));
  }
});
