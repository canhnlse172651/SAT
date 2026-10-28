import { expect, test } from '@playwright/test';
import { MIN, T10, advanceClock, call, draftExam, evidence, freshStudents, gvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-6.4] TC-043 "Lưu trữ" only for a closed exam', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await draftExam(page, { name: `TC-043 Nháp ${t}` });
  await scheduledExam(page, { name: `TC-043 Lịch ${t}`, classIds: [A.id], openIn: 24 * 60 });
  const open = await scheduledExam(page, { name: `TC-043 Mở ${t}`, classIds: [A.id], dur: 30, closeAfter: 120 });
  await scheduledExam(page, { name: `TC-043 Đóng ${t}`, classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, 2 * MIN);

  await page.goto(T10);
  for (const [label, can] of [['Nháp', false], ['Lịch', false], ['Mở', false], ['Đóng', true]] as const) {
    const name = `TC-043 ${label} ${t}`;
    await page.locator('tr', { hasText: name }).getByRole('button', { name: `Thao tác khác · ${name}` }).click();
    await expect(page.getByRole('menuitem', { name: 'Lưu trữ' })).toHaveCount(can ? 1 : 0);
    await page.locator('tr', { hasText: name }).getByRole('button', { name: `Thao tác khác · ${name}` }).click();
  }
  await evidence(page, 'TC-043');
  const r = await call(page, 'POST', `/api/exams/${open.id}/archive`);
  expect(r.status).toBe(409);
});
