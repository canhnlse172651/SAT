/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S05, api, b6, b6Answers, classWithSets, evidence, gvPage, hvPage, saveAnswers, saveItem, setContent, start, submit } from './helpers';

test('[005:AC-16.1] [005:AC-17.6] TC-081 graded with the key in force at submission', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ B6', content: b6() }]);
  const setId = d.sets[0]!;
  const content = await setContent(gv, d.les, setId);
  const answers = b6Answers(content);
  // Q6 left unanswered.
  delete answers[content.questions[5].id];
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await start(hv, d.cls, setId);
  await saveAnswers(hv, d.cls, setId, answers);
  // The GV changes the key of Q1 (B → C) while the HV is working (no submission yet: no re-grading needed).
  const edited = structuredClone(content);
  edited.questions[0].options.forEach((o: any, k: number) => (o.correct = k === 2));
  const s = await saveItem(gv, d.les, setId, 'Bộ B6', edited);
  expect(s.status, JSON.stringify(s.body)).toBe(200);

  // 1. The HV submits.
  const r = await submit(hv, d.cls, setId, answers);
  expect(r.status).toBeLessThan(300);
  // 2. The submissions of the set (data for 008 / 009).
  const list = await api<any>(gv, 'GET', `/api/exercises/classes/${d.cls}/sets/${setId}/submissions`);
  const mine = list.items.find((i: any) => i.student.id === d.students[0]);
  // 12 − Q1 (old key, now wrong) − Q6 (unanswered) = 10.
  expect([mine.score, mine.maxScore, mine.late]).toEqual([10, 12, false]);
  expect(Date.parse(mine.submittedAt)).toBeGreaterThan(Date.now() - 60_000);
  await hv.goto(S05(d.cls, setId));
  await expect(hv.getByText(/^Đã hoàn thành · /)).toBeVisible();
  await evidence(hv, 'TC-081');
});
