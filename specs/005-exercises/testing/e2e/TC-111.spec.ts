/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S05, api, call, doSet, evidence, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet,
  saveAnswers, set, setContent, setDeadline, start, studentIds, vnToday,
} from './helpers';

test('[005:AC-23.5] TC-111 changing or clearing a deadline relabels at once', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const setId = await publishedSet(gv, les.id, 'Bộ đổi hạn', set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]));
  await publishLesson(gv, les.id);
  const [c, dId, other] = await studentIds(gv);
  const A = await newClass(gv, cur.id, [c!, dId!]);
  const B = await newClass(gv, cur.id, [other!]);
  await setDeadline(gv, A.id, setId, vnToday(-1));
  await setDeadline(gv, B.id, setId, vnToday(4));
  const q = (await setContent(gv, les.id, setId)).questions[0];
  // HV C submits today (deadline yesterday): late. HV D has not submitted (an attempt in progress).
  const pc = (await hvPage(browser, c!)).page;
  await doSet(pc, A.id, setId, { [q.id]: { optionIds: [q.options[0].id] } });
  const pd = (await hvPage(browser, dId!)).page;
  await start(pd, A.id, setId);
  await saveAnswers(pd, A.id, setId, { [q.id]: { optionIds: [q.options[0].id] } });
  const subC = async () => (await api<any>(gv, 'GET', `/api/exercises/classes/${A.id}/sets/${setId}/submissions`)).items[0];
  const first = await subC();
  expect(first.late).toBe(true);
  const stateD = async () => (await call(pd, 'GET', `/api/learn/classes/${A.id}/sets/${setId}`)).body.set.status;
  expect(await stateD()).toBe('overdue');
  const otherLabel = (await call((await hvPage(browser, other!)).page, 'GET', `/api/learn/classes/${B.id}/sets/${setId}`)).body.set;

  // 1. Deadline → in 4 days: C no longer late, D "Đang làm".
  await setDeadline(gv, A.id, setId, vnToday(4));
  expect((await subC()).late).toBe(false);
  expect(await stateD()).toBe('doing');
  await pc.goto(S05(A.id, setId));
  await expect(pc.getByText('Nộp muộn', { exact: true })).toHaveCount(0);
  await evidence(pc, 'TC-111', 1);
  // 2. Deadline → 2 days ago: C's submission is late again.
  await setDeadline(gv, A.id, setId, vnToday(-2));
  expect((await subC()).late).toBe(true);
  await pc.reload();
  await expect(pc.getByText('Nộp muộn', { exact: true })).toBeVisible();
  // 3. Cleared: no "Nộp muộn" / "Quá hạn", D "Chưa mở".
  await setDeadline(gv, A.id, setId, null);
  expect((await subC()).late).toBe(false);
  expect(await stateD()).toBe('closed');
  await pd.goto(S05(A.id, setId));
  await expect(pd.locator('[data-screen="S05"] .hv-row__chips .chip').first()).toHaveText('Chưa mở');
  await evidence(pd, 'TC-111', 2);
  // Score and submission time unchanged; the other class unchanged.
  const last = await subC();
  expect([last.score, last.submittedAt]).toEqual([first.score, first.submittedAt]);
  const after = (await call((await hvPage(browser, other!)).page, 'GET', `/api/learn/classes/${B.id}/sets/${setId}`)).body.set;
  expect([after.status, after.deadlineLabel]).toEqual([otherLabel.status, otherLabel.deadlineLabel]);
});
