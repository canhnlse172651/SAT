/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { freshStudents, getExam, gvPage, holder, hvPage, newClass, saveExam, scheduledExam, start } from './helpers';

test('[006:AC-4.2] TC-030 API refuses question and duration changes once locked', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  expect((await start(hv.page, ex.id, holder())).status).toBe(200);
  const before = await getExam(page, ex.id);
  const changed = structuredClone(before.content);
  changed.questions[0].options = changed.questions[0].options.map((o: any, k: number) => ({ ...o, correct: k === 1 }));
  const r1 = await saveExam(page, ex.id, { content: changed });
  expect(r1.status).toBe(409);
  expect(r1.body.error.code).toBe('EXAM_LOCKED');
  const r2 = await saveExam(page, ex.id, { durationMin: 60 });
  expect(r2.status).toBe(409);
  const after = await getExam(page, ex.id);
  expect(after.content).toEqual(before.content);
  expect(after.durationMin).toBe(45);
});
