import { expect, test } from '@playwright/test';
import { MIN, T10, advanceClock, evidence, freshStudents, gvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-3.6] TC-023 Đã lên lịch → Đang mở → Đã đóng by the clock alone', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await scheduledExam(page, { name: `TC-023 ${t}`, classIds: [A.id], openIn: 2, dur: 30, closeAfter: 60 });
  const row = page.locator('tr', { hasText: `TC-023 ${t}` });
  await page.goto(T10);
  await expect(row).toContainText('Đã lên lịch');
  await advanceClock(page, 2 * MIN + 5000);
  // The list refreshes by itself (30 s) — or on the next visit; the state follows the server clock.
  await expect(row).toContainText('Đang mở', { timeout: 40_000 });
  await evidence(page, 'TC-023', 1);
  await advanceClock(page, 60 * MIN);
  await expect(row).toContainText('Đã đóng', { timeout: 40_000 });
  await evidence(page, 'TC-023', 2);
});
