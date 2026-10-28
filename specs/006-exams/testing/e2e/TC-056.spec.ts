import { expect, test } from '@playwright/test';
import {
  MIN, S07, advanceClock, card, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam,
  timerSeconds, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-8.2] TC-056 less time left than the duration: the lobby warns with the minutes left', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-056 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 45, closeAfter: 66 });
  // 20 min 30 s before the close.
  await advanceClock(page, ex.closesAtDate.getTime() - (20 * MIN + 30_000) - Date.now());
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await card(hv.page, name).getByRole('button', { name: 'Vào thi' }).click();
  const close = new Date(ex.closesAtDate.getTime() + 7 * 3600e3).toISOString().slice(11, 16);
  await expect(hv.page.getByText(new RegExp(`^Bài thi đóng lúc ${close} — bạn chỉ còn 20 phút để làm bài\\.$`))).toBeVisible();
  await evidence(hv.page, 'TC-056', 1);
  await hv.page.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  await expect(hv.page.getByRole('timer', { name: 'Thời gian còn lại' })).toBeVisible();
  const s = await timerSeconds(hv.page);
  expect(s).toBeLessThanOrEqual(20 * 60 + 30);
  expect(s).toBeGreaterThan(20 * 60);
  await evidence(hv.page, 'TC-056', 2);
});
