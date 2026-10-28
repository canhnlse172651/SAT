/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  advanceClock, api, contentOf, e3Answers, freshStudents, gvPage, holder, hvPage, newClass, resetClock, save,
  scheduledExam, serverNow, start,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-10.2] [006:AC-12.2] TC-072 answers reaching the system up to end + 10 s count, later ones do not', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 1, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const k = holder();
  const s = await start(hv.page, ex.id, k);
  expect(s.status).toBe(200);
  const content = await contentOf(page, ex.id);
  const all = e3Answers(content);
  const [q1, q2, q3] = content.questions.map((q: any) => q.id);
  expect((await save(hv.page, ex.id, k, { [q1]: all[q1] })).status).toBe(200);
  const endsAt = Date.parse(s.body.endsAt);
  await advanceClock(page, endsAt + 8000 - (await serverNow(page)).getTime());
  const late = await save(hv.page, ex.id, k, { [q2]: all[q2] });
  expect(late.status, JSON.stringify(late.body)).toBe(200);
  await advanceClock(page, 4000);
  const tooLate = await save(hv.page, ex.id, k, { [q3]: all[q3] });
  expect(tooLate.status).toBe(409);
  const sub = await api<any>(page, 'GET', `/api/exams/${ex.id}/submissions/${h}?classId=${A.id}`);
  expect(sub.auto).toBe(true);
  expect(sub.rows.map((r: any) => r.verdict)).toEqual(['correct', 'correct', 'unanswered']);
});
