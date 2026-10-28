import { expect, test } from '@playwright/test';
import {
  advanceClock, answerE3, clockOf, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam,
  serverNow, startOnScreen, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-11.4] TC-081 "Thử lại" after the attempt was submitted automatically shows the automatic submission', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-081 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 5, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  const endsAt = Date.parse((await clockOf(p, ex.id)).endsAt);
  await answerE3(p, { q1: 'Xin chào' });
  await expect(p.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  await hv.ctx.setOffline(true);
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await p.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(p.getByText('Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.')).toBeVisible();
  // The time runs out while offline; the system submits automatically (settled on the GV's next read).
  await advanceClock(page, endsAt + 15_000 - (await serverNow(page)).getTime());
  await page.request.get(`/api/exams/${ex.id}/results?classId=${A.id}`);
  await hv.ctx.setOffline(false);
  const retry = p.getByRole('button', { name: 'Thử lại' });
  if (await retry.isVisible()) await retry.click();
  const hm = new Date(endsAt + 7 * 3600e3).toISOString().slice(11, 16);
  await expect(p.getByText(`Hết giờ — bài thi đã được nộp tự động lúc ${hm}`)).toBeVisible({ timeout: 8000 });
  await expect(p.getByRole('button', { name: 'Xem kết quả' })).toBeVisible();
  await evidence(p, 'TC-081');
});
