/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  MIN, addToClass, advanceClock, api, doExam, feed, freshStudents, gvPage, hvPage, inactiveStudent, newClass, resetClock,
  scheduledExam,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-13.3] TC-090 "Không làm bài" at the close for counted HV, per assigned class', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2, h3, h5] = await freshStudents(page, 4);
  const na = await inactiveStudent(page);
  const A = await newClass(page, [h1!, h2!]);
  const B = await newClass(page, [h2!, h3!, na]);
  const ex = await scheduledExam(page, { classIds: [A.id, B.id], dur: 1, closeAfter: 1 });
  const hv1 = await hvPage(browser, h1!);
  await doExam(page, hv1.page, ex.id);
  await api(page, 'POST', `/api/students/${h3}/lock`);
  await advanceClock(page, MIN + 75_000);
  await page.request.get('/api/exams');
  await addToClass(page, A.id, [h5!]);
  const a = (await feed(page, A.id)).filter((r) => r.examId === ex.id);
  const b = (await feed(page, B.id)).filter((r) => r.examId === ex.id);
  const kinds = (rows: any[]) => Object.fromEntries(rows.map((r) => [r.studentId, `${r.kind}:${r.percent}`]));
  expect(kinds(a)).toEqual({ [h1!]: 'submitted:100', [h2!]: 'noShow:0' });
  expect(kinds(b)).toEqual({ [h2!]: 'noShow:0', [h3!]: 'noShow:0' });
});
