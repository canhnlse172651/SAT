import { expect, test } from '@playwright/test';
import { MIN, advanceClock, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, startOnScreen, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-9.1] TC-064 the countdown: h:mm:ss from an hour, mm:ss under, server time', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-064 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id], dur: 90, closeAfter: 120 });
  const hv = await hvPage(browser, h!);
  await startOnScreen(hv.page, name);
  const timer = hv.page.getByRole('timer', { name: 'Thời gian còn lại' });
  await expect(timer).toHaveText(/^1:29:5\d$|^1:30:00$/);
  await evidence(hv.page, 'TC-064', 1);
  await advanceClock(page, 31 * MIN);
  await expect(timer).toHaveText(/^58:\d\d$/, { timeout: 7000 });
  await evidence(hv.page, 'TC-064', 2);
});
