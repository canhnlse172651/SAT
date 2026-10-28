import { expect, test } from '@playwright/test';
import { MIN, T10, advanceClock, api, evidence, freshStudents, gvPage, newClass, otherGvPage, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-1.5] TC-005 archived exams behind "Hiện bài thi lưu trữ (n)", after Đã đóng', async ({ browser }) => {
  // A workspace of its own so the archived count is exactly this test's.
  const { page } = await otherGvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await scheduledExam(page, { name: `TC-005 Đóng ${t}`, classIds: [A.id], dur: 1, closeAfter: 1 });
  const a1 = await scheduledExam(page, { name: `TC-005 Lưu trữ 1 ${t}`, classIds: [A.id], dur: 1, closeAfter: 1 });
  const a2 = await scheduledExam(page, { name: `TC-005 Lưu trữ 2 ${t}`, classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, 2 * MIN);
  await api(page, 'POST', `/api/exams/${a1.id}/archive`);
  await api(page, 'POST', `/api/exams/${a2.id}/archive`);

  await page.goto(T10);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('switch', { name: 'Hiện bài thi lưu trữ (2)' }).click();
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText(`TC-005 Đóng ${t}`);
  await expect(rows.nth(1)).toContainText('Lưu trữ');
  await expect(rows.nth(2)).toContainText('Lưu trữ');
  await evidence(page, 'TC-005');
});
