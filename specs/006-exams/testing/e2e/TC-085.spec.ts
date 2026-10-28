import { expect, test } from '@playwright/test';
import {
  advanceClock, clockOf, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, serverNow,
  startOnScreen, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-12.3] TC-085 time up while the submit confirmation is open: replaced by the time-up notice', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-085 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 5, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  const endsAt = Date.parse((await clockOf(p, ex.id)).endsAt);
  await advanceClock(page, endsAt - 8000 - (await serverNow(page)).getTime());
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await expect(p.getByRole('alertdialog')).toBeVisible();
  const hm = new Date(endsAt + 7 * 3600e3).toISOString().slice(11, 16);
  await expect(p.getByText(`Hết giờ — bài thi đã được nộp tự động lúc ${hm}`)).toBeVisible({ timeout: 25_000 });
  await expect(p.getByRole('alertdialog')).toHaveCount(0);
  await evidence(p, 'TC-085');
});
