import { expect, test } from '@playwright/test';
import { contentOf, feed, freshStudents, gvPage, holder, hvPage, mcqAnswers, mcqs, newClass, scheduledExam, start, submit } from './helpers';

test('[006:AC-13.4] TC-091 the one submission counts in every assigned class of the HV', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h2] = await freshStudents(page, 1);
  const A = await newClass(page, [h2!]);
  const B = await newClass(page, [h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id, B.id], content: mcqs(20) });
  const content = await contentOf(page, ex.id);
  const answers = mcqAnswers(content);
  for (const q of content.questions.slice(17)) delete answers[q.id]; // 17 / 20 = 85
  const hv = await hvPage(browser, h2!);
  const k = holder();
  expect((await start(hv.page, ex.id, k)).status).toBe(200);
  expect((await submit(hv.page, ex.id, k, answers)).status).toBe(200);
  const a = (await feed(page, A.id)).find((r) => r.examId === ex.id);
  const b = (await feed(page, B.id)).find((r) => r.examId === ex.id);
  expect(a).toMatchObject({ studentId: h2, kind: 'submitted', percent: 85 });
  expect(b).toMatchObject({ studentId: h2, kind: 'submitted', percent: 85 });
  expect(a.submittedAt).toBe(b.submittedAt);
});
