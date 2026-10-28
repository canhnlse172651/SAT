/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T14, api, doExam, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam } from './helpers';

test('[006:AC-13.1] TC-088 graded at once with partial credit; unanswered parts earn 0', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  await doExam(page, hv.page, ex.id, { q1: true, q2: 'half', q3: null });
  const sub = await api<any>(page, 'GET', `/api/exams/${ex.id}/submissions/${h}?classId=${A.id}`);
  expect(sub.rows.map((r: any) => [r.verdict, r.earned, r.max])).toEqual([
    ['correct', 1, 1],
    ['partial', 1, 2],
    ['unanswered', 0, 1],
  ]);
  await page.goto(T14(ex.id, A.id, h!));
  await expect(page.getByText('Đúng một phần')).toBeVisible();
  await expect(page.getByText('Chưa trả lời').first()).toBeVisible();
  await evidence(page, 'TC-088');
});
