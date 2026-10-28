/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { api, classWithSets, gvPage, hvPage, mcq, review, saveAnswers, set, setContent, start, submit } from './helpers';

test('[005:AC-15.5] [005:NFR-3] TC-080 the same submit key three times = one submission', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ một lần', content: set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const { page: hv } = await hvPage(browser, d.students[0]!);
  await start(hv, d.cls, setId);
  const answers = { [q.id]: { optionIds: [q.options[0].id] } };
  await saveAnswers(hv, d.cls, setId, answers);

  // 1. Three parallel submits with the same key.
  const key = 'samekey12345678';
  const rs = await Promise.all([1, 2, 3].map(() => submit(hv, d.cls, setId, answers, key)));
  expect(rs.map((r) => r.status < 300), JSON.stringify(rs)).toEqual([true, true, true]);
  const rev = (await review(hv, d.cls, setId)).body;
  expect(rev.submitted).toBe(true);
  // Exactly one submission.
  const list = await api<any>(gv, 'GET', `/api/exercises/classes/${d.cls}/sets/${setId}/submissions`);
  expect(list.items.filter((i: any) => i.student.id === d.students[0])).toHaveLength(1);
  expect(list.items[0].submittedAt).toBe(rev.submittedAt);
});
