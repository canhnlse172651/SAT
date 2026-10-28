import { expect, test } from '@playwright/test';
import { MIN, advanceClock, freshStudents, gvPage, newClass, resetClock, saveExam, scheduledExam } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-4.1] TC-028 a past open time counts only when it is changed', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 45, closeAfter: 120 });
  await advanceClock(page, 10 * MIN);
  const r1 = await saveExam(page, ex.id, { name: 'TC-028 đổi tên' });
  expect(r1.status, JSON.stringify(r1.body)).toBe(200);
  const r2 = await saveExam(page, ex.id, { opensAt: new Date(ex.opensAtDate.getTime() + 5 * MIN).toISOString() });
  expect(r2.status).toBe(422);
  expect(r2.body.error.code).toBe('EXAM_NOT_READY');
  expect(JSON.stringify(r2.body.error.details.issues)).toContain('Giờ mở không được sớm hơn thời điểm hiện tại');
});
