import { expect, test } from '@playwright/test';
import { MIN, advanceClock, freshStudents, getExam, gvPage, newClass, resetClock, saveExam, scheduledExam } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-4.4] TC-033 API refuses classes and close changes on a closed exam', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const B = await newClass(page, [h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, 2 * MIN);
  const before = await getExam(page, ex.id);
  const r1 = await saveExam(page, ex.id, { classIds: [A.id, B.id] });
  expect(r1.status).toBe(409);
  const r2 = await saveExam(page, ex.id, { closesAt: new Date(ex.closesAtDate.getTime() + 60 * MIN).toISOString() });
  expect(r2.status).toBe(409);
  const after = await getExam(page, ex.id);
  expect(after.classIds).toEqual(before.classIds);
  expect(after.closesAt).toBe(before.closesAt);
});
