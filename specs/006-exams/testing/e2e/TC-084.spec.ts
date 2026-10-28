import { expect, test } from '@playwright/test';
import {
  S08, advanceClock, clockOf, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, serverNow,
  startOnScreen, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-12.3] TC-084 time up on screen: "Hết giờ — … nộp tự động lúc HH:mm", answers locked; also on reopening', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-084 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 5, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  const endsAt = Date.parse((await clockOf(p, ex.id)).endsAt);
  await advanceClock(page, endsAt - 10_000 - (await serverNow(page)).getTime());
  const hm = new Date(endsAt + 7 * 3600e3).toISOString().slice(11, 16);
  const notice = p.getByText(`Hết giờ — bài thi đã được nộp tự động lúc ${hm}`);
  await expect(notice).toBeVisible({ timeout: 25_000 });
  await expect(p.getByRole('button', { name: 'Xem kết quả' })).toBeVisible();
  await expect(p.getByRole('button', { name: 'Nộp bài' })).toBeDisabled();
  await evidence(p, 'TC-084', 1);
  await p.goto('/hv');
  await p.goto(S08(ex.id));
  await expect(notice).toBeVisible();
  await expect(p.getByRole('button', { name: 'Xem kết quả' })).toBeVisible();
  await evidence(p, 'TC-084', 2);
});
