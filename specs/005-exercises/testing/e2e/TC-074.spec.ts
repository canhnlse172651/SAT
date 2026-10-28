/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classWithSets, gvPage, hvPage, mcq, saveAnswers, set, setContent, start, view } from './helpers';

test('[005:AC-14.8] [005:NFR-3] TC-074 two starts at once make one attempt', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [{ title: 'Bộ song song', content: set([q('Một'), q('Hai')]) }]);
  const setId = d.sets[0]!;
  const [q1, q2] = (await setContent(gv, d.les, setId)).questions;
  const c1 = await hvPage(browser, d.students[0]!);
  const c2 = await hvPage(browser, d.students[0]!);

  // 1. Two "start" at the same time.
  const [s1, s2] = await Promise.all([start(c1.page, d.cls, setId), start(c2.page, d.cls, setId)]);
  expect([s1.status, s2.status]).toEqual([s1.status < 300 ? s1.status : 200, s2.status < 300 ? s2.status : 200]);
  expect(s1.body.attempt.questions.map((x: any) => x.id)).toEqual(s2.body.attempt.questions.map((x: any) => x.id));
  // 2. Q1 from context 1, Q2 from context 2.
  expect((await saveAnswers(c1.page, d.cls, setId, { [q1.id]: { optionIds: [q1.options[0].id] } })).status).toBeLessThan(300);
  expect((await saveAnswers(c2.page, d.cls, setId, { [q2.id]: { optionIds: [q2.options[1].id] } })).status).toBeLessThan(300);
  // Both continue the same attempt and keep both answers.
  for (const c of [c1, c2]) {
    const v = await view(c.page, d.cls, setId);
    expect(v.body.hasAttempt).toBe(true);
    expect(v.body.attempt.answers[q1.id].optionIds).toEqual([q1.options[0].id]);
    expect(v.body.attempt.answers[q2.id].optionIds).toEqual([q2.options[1].id]);
  }
});
