import { test, expect } from '@playwright/test';
import {
  advanceClock,
  apiAs,
  createClass,
  ddmmyyyy,
  newStudent,
  newWorkspaceGv,
  ok,
  resetClock,
  seedCurriculum,
  shot,
  signIn,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-8.8] TC-032 kích hoạt HV đang thuộc lớp: giữ tư cách và ngày vào lớp, thấy lớp ngay', async ({
  page,
  browser,
}) => {
  const gv0 = await newWorkspaceGv();
  const cur = await seedCurriculum(gv0, 'TC-032 GT', [{ name: 'Bài 1', steps: 1 }]);
  const hv = await newStudent(gv0, 'Mai Mới');
  const joined = vnDay();
  const cls = await createClass(gv0, { name: 'TC-032 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  const me = await ok(gv0, 'GET', '/session');
  // The HV was added "hôm qua": move to the next day (the GV's 8 h session expires, so sign in again).
  await advanceClock(gv0, 24 * 3600_000);
  try {
    const gv = await apiAs('GV', me.user.id);
    await signInLike(page, gv);
    await page.goto('/gv/hoc-vien');
    await ok(gv, 'POST', `/students/${hv.id}/activate`, {});
    await expect
      .poll(async () => (await ok(gv, 'GET', `/students/${hv.id}`)).status, { timeout: 20_000 })
      .toBe('active');

    const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const hvPage = await hvCtx.newPage();
    await signIn(hvPage, 'HV', hv.id);
    await hvPage.goto('/hv');
    await expect(hvPage.getByRole('link', { name: /TC-032 Lớp/ })).toBeVisible();
    await shot(hvPage, 'TC-032', 1);

    await page.goto(`/gv/lop-hoc/${cls.id}?tab=hoc-vien`);
    const row = page.getByRole('row').filter({ hasText: 'Mai Mới' });
    await expect(row).toContainText('Đã kích hoạt');
    await expect(row).toContainText(ddmmyyyy(joined));
    await shot(page, 'TC-032', 2);
  } finally {
    await resetClock(gv0);
  }
});
