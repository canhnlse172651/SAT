import { expect, test } from '@playwright/test';
import { MIN, T10, advanceClock, draftExam, evidence, freshStudents, gvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-1.2] TC-002 T10 groups Đang mở → Đã lên lịch → Nháp → Đã đóng with their order', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  const n = (s: string) => `TC-002 ${s} ${t}`;
  // Closed once the clock moves 5 min (close +3 and +4): latest close first.
  await scheduledExam(page, { name: n('Đóng sớm'), classIds: [A.id], dur: 1, closeAfter: 3 });
  await scheduledExam(page, { name: n('Đóng muộn'), classIds: [A.id], dur: 1, closeAfter: 4 });
  // Open after the move (opened at +1 and +2 min): earliest open first.
  await scheduledExam(page, { name: n('Mở 2'), classIds: [A.id], openIn: 2, dur: 30, closeAfter: 120 });
  await scheduledExam(page, { name: n('Mở 1'), classIds: [A.id], openIn: 1, dur: 30, closeAfter: 120 });
  // Scheduled: tomorrow before the day after.
  await scheduledExam(page, { name: n('Lịch ngày kia'), classIds: [A.id], openIn: 48 * 60, dur: 30, closeAfter: 120 });
  await scheduledExam(page, { name: n('Lịch ngày mai'), classIds: [A.id], openIn: 24 * 60, dur: 30, closeAfter: 120 });
  // Drafts: the later save first.
  await draftExam(page, { name: n('Nháp cũ') });
  await draftExam(page, { name: n('Nháp mới') });
  await advanceClock(page, 5 * MIN);

  await page.goto(T10);
  await expect(page.locator('tbody tr').first()).toBeVisible();
  // The states follow the server clock once the page has synced with it (≤ 1 s after the list arrives — see the report).
  await expect
    .poll(async () => (await page.locator('tbody tr a.strong').allInnerTexts()).filter((x) => x.endsWith(t)), { timeout: 5000 })
    .toEqual([n('Mở 1'), n('Mở 2'), n('Lịch ngày mai'), n('Lịch ngày kia'), n('Nháp mới'), n('Nháp cũ'), n('Đóng muộn'), n('Đóng sớm')]);
  await evidence(page, 'TC-002');
});
