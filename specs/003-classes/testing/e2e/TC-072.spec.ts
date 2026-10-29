import { test, expect } from '@playwright/test';
import { addDays, apiAs, clockTo, createClass, ddmmyyyy, newWorkspaceGv, ok, pickDay, resetClock, seedCurriculum, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const PAST = 'Ngày đã qua — học viên chưa làm sẽ thấy “Quá hạn” ngay và không có thư nhắc.';
const NO_MAIL = 'Học viên sẽ không nhận email nhắc cho hạn nộp này.';

test('[003:AC-21.4] [003:AC-21.5] TC-072 cảnh báo ngày đã qua và không có thư nhắc', async ({ page }) => {
  const gv0 = await newWorkspaceGv();
  const cur = await seedCurriculum(gv0, 'TC-072 GT', [{ name: 'Bài 1', sets: 1 }]);
  const today = vnDay();
  const cls = await createClass(gv0, { name: 'TC-072 Lớp', curriculumId: cur.id, startDate: addDays(today, 5) });
  const me = await ok(gv0, 'GET', '/session');
  await clockTo(gv0, today, '09:00');
  try {
    const gv = await apiAs('GV', me.user.id);
    await signInLike(page, gv);
    await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
    await page.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 1: chưa đặt' }).click();
    const pop = page.getByRole('dialog', { name: 'Hạn nộp Bài 1 · Bộ 1' });

    await pickDay(pop, addDays(today, -2));
    await expect(pop.getByText(PAST, { exact: true })).toBeVisible();
    await expect(pop.getByRole('button', { name: 'Áp dụng' })).toBeEnabled();
    await shot(page, 'TC-072', 1);
    await pop.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(
      page.getByText(
        `Đã đặt hạn ${ddmmyyyy(addDays(today, -2))} — ngày đã qua: học viên chưa làm thấy “Quá hạn”, không gửi nhắc.`,
        { exact: true },
      ),
    ).toBeVisible();

    await page.getByRole('button', { name: /^Hạn nộp Bài 1 · Bộ 1:/ }).click();
    await pickDay(pop, today);
    await expect(pop.getByText(NO_MAIL, { exact: true })).toBeVisible();
    await expect(pop.getByText(PAST, { exact: true })).toHaveCount(0);
    await pickDay(pop, addDays(today, 3));
    await expect(pop.getByText(NO_MAIL, { exact: true })).toBeVisible();
    await expect(pop.getByRole('button', { name: 'Áp dụng' })).toBeEnabled();
    await shot(page, 'TC-072', 2);
  } finally {
    await resetClock(await apiAs('GV', me.user.id));
  }
});
