import { expect, test } from '@playwright/test';
import { feed, freshStudents, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-13.6] TC-093 nothing for 008 while an HV is doing or has not started an open exam', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!, h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv1 = await hvPage(browser, h1!);
  expect((await start(hv1.page, ex.id, holder())).status).toBe(200);
  expect((await feed(page, A.id)).filter((r) => r.examId === ex.id)).toEqual([]);
});
