import { test, expect } from '@playwright/test';
import {
  addDays,
  advanceClock,
  apiAs,
  createClass,
  ddmmyyyy,
  resetClock,
  seedCurriculum,
  shot,
  signIn,
  studentByEmail,
  uid,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-7.3] [003:AC-7.4] TC-025 sửa thông tin lớp Đang học bắt đầu 400 ngày trước', async ({ page, browser }) => {
  const gv0 = await apiAs('GV');
  const cur = await seedCurriculum(gv0, `TC-025 GT ${uid()}`, [{ name: 'Bài 1', steps: 1 }]);
  const hv1 = await studentByEmail(gv0, 'hv1@sat.dev');
  const other = `TC-025 Khác ${uid()}`;
  await createClass(gv0, { name: other, curriculumId: cur.id });
  const name = `TC-025 Lớp ${uid()}`;
  const cls = await createClass(gv0, { name, curriculumId: cur.id, studentIds: [hv1.id] });
  await advanceClock(gv0, 400 * 24 * 3600_000);
  try {
    const later = vnDay(Date.now() + 400 * 24 * 3600_000);
    await signIn(page, 'GV');
    await page.goto(`/gv/lop-hoc/${cls.id}`);
    const renamed = `${name} mới`;
    await page.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
    const dlg = page.getByRole('dialog', { name: 'Sửa thông tin lớp' });
    await dlg.getByLabel('Tên lớp').fill(renamed);
    await dlg.getByLabel('Mô tả').fill('Mô tả mới');
    await dlg.getByLabel('Lịch học').fill('Thứ 7 — 9:00');
    await dlg.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();
    await expect(dlg).toBeHidden();
    await expect(page.getByRole('heading', { name: new RegExp(renamed) })).toBeVisible();
    await expect(page.getByRole('tabpanel')).toContainText('Mô tả mới');
    await expect(page.getByRole('tabpanel')).toContainText('Thứ 7 — 9:00');
    await page.goto('/gv/lop-hoc');
    await page.getByLabel('Tìm theo tên lớp').fill(renamed);
    await expect(page.getByRole('link', { name: renamed })).toBeVisible();
    await shot(page, 'TC-025', 1);

    const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const hvPage = await hvCtx.newPage();
    await signIn(hvPage, 'HV', hv1.id);
    await hvPage.goto('/hv');
    await expect(hvPage.getByRole('link', { name: new RegExp(renamed) })).toBeVisible();
    await hvPage.goto(`/hv/lop/${cls.id}`);
    await expect(hvPage.getByRole('heading', { name: renamed })).toBeVisible();
    await expect(hvPage.getByText('Thứ 7 — 9:00')).toBeVisible();

    await page.goto(`/gv/lop-hoc/${cls.id}`);
    await page.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
    await dlg.getByLabel('Ngày bắt đầu').fill(ddmmyyyy(addDays(later, 1)));
    await dlg.getByLabel('Ngày bắt đầu').blur();
    await dlg.getByRole('button', { name: 'Lưu' }).click();
    await expect(
      dlg.getByText('Lớp đang học — chỉ có thể đổi ngày bắt đầu thành hôm nay hoặc một ngày đã qua', { exact: true }),
    ).toBeVisible();
    await shot(page, 'TC-025', 2);
    await dlg.getByRole('button', { name: 'Hủy' }).click();

    await page.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
    await dlg.getByLabel('Tên lớp').fill(other);
    await dlg.getByRole('button', { name: 'Lưu' }).click();
    await expect(dlg.getByText('Tên lớp đã tồn tại', { exact: true })).toBeVisible();
    await dlg.getByLabel('Tên lớp').fill(renamed);
    await dlg.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();
    await shot(page, 'TC-025', 3);
  } finally {
    await resetClock(gv0);
  }
});
