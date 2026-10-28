import { expect, test } from '@playwright/test';
import {
  MIN, T22, advanceClock, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, startOnScreen,
  timerSeconds, uid, vnInput,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-5.2] TC-035 a later close lengthens the running attempt on the HV clock within 10 s', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-035 ${uid()}`;
  // Duration 60, close 80 min after the open; the HV starts 60 min later → about 20 min left (bounded by the close).
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 60, closeAfter: 80 });
  await advanceClock(page, 60 * MIN);
  const hv = await hvPage(browser, h!);
  await startOnScreen(hv.page, name);
  const before = await timerSeconds(hv.page);
  expect(before).toBeLessThanOrEqual(20 * 60);
  expect(before).toBeGreaterThan(18 * 60);

  await page.goto(T22(ex.id));
  await page.getByLabel('Giờ đóng').fill(vnInput(new Date(ex.closesAtDate.getTime() + 30 * MIN)));
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  // min(start + 60, new close) ≈ 50 min left; the HV page polls every 5 s.
  await expect.poll(() => timerSeconds(hv.page), { timeout: 10_000, intervals: [500] }).toBeGreaterThan(before + 25 * 60);
  await evidence(hv.page, 'TC-035');
});
