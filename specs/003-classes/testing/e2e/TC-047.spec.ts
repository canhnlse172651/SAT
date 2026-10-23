import { test, expect } from '@playwright/test';
import { addDays, apiAs, clockTo, createClass, ddmmyyyy, newStudent, newWorkspaceGv, ok, resetClock, seedCurriculum, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-14.2] TC-047 00:00 (UTC+7) ngày bắt đầu: lớp tự chuyển Đang học, nội dung mở', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-047 GT', [{ name: 'Bài 1', steps: 1 }]);
  const hv = await newStudent(gv, 'Oanh Chờ', { activate: true });
  const start = addDays(vnDay(), 1);
  const cls = await createClass(gv, { name: 'TC-047 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: start });
  const me = await ok(gv, 'GET', '/session');
  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${cls.id}`);
  await expect(
    page.getByText(`Lớp sẽ bắt đầu vào ngày ${ddmmyyyy(start)}. Nội dung sẽ mở từ ngày này.`, { exact: true }),
  ).toBeVisible();
  await shot(page, 'TC-047', 1);

  await clockTo(gv, start, '00:00');
  try {
    // 30 seconds after midnight; the HV session is 30 days, so it is still valid.
    await ok(await apiAs('GV', me.user.id), 'POST', '/dev/clock', { advanceMs: 30_000 });
    await page.reload();
    await expect(page.locator('.hv-info')).toContainText('Đang học');
    await expect(page.locator('.hv-list a.hv-row').first()).toContainText('Bài 1');
    await shot(page, 'TC-047', 2);
  } finally {
    await resetClock(await apiAs('GV', me.user.id));
  }
});
