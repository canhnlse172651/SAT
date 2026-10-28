/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  api, call, classWithSets, gvPage, hvPage, mcq, saveAnswers, saveItem, set, setContent, setDeadline, start, submit, vnToday,
} from './helpers';

test('[005:AC-17.6] TC-088 what 008 / 009 read follows every event', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [{ title: 'Bộ theo dõi', content: set([q('Một'), q('Hai')]), deadline: vnToday(5) }]);
  const setId = d.sets[0]!;
  const content = await setContent(gv, d.les, setId);
  const hvId = d.students[0]!;
  const { page: hv } = await hvPage(browser, hvId);
  const subs = async () =>
    (await api<any>(gv, 'GET', `/api/exercises/classes/${d.cls}/sets/${setId}/submissions`)).items.find((i: any) => i.student.id === hvId);
  const s11 = async () => {
    const u = (await call(hv, 'GET', `/api/my-classes/${d.cls}/lessons/${d.les}`)).body;
    return u.sets.find((s: any) => s.id === setId);
  };

  // HV starts.
  await start(hv, d.cls, setId);
  expect(await subs()).toBeUndefined();
  // Started (AC-17.6 "WHEN HV bắt đầu một lượt làm"): "Đang làm" (AC-17.5 "có lượt làm dở").
  expect.soft((await s11()).status, 'state after "Bắt đầu làm" (no answer yet)').toBe('doing');
  expect.soft((await call(hv, 'GET', `/api/learn/classes/${d.cls}/sets/${setId}`)).body.set.status, 'S05 state').toBe('doing');
  // HV submits (both right).
  const answers = Object.fromEntries(content.questions.map((x: any) => [x.id, { optionIds: [x.options[0].id] }]));
  await saveAnswers(hv, d.cls, setId, answers);
  await submit(hv, d.cls, setId, answers);
  let row = await subs();
  expect([row.score, row.maxScore, row.late]).toEqual([2, 2, false]);
  const at = row.submittedAt;
  expect((await s11()).status).toBe('done');
  expect([(await s11()).score, (await s11()).late]).toEqual([2, false]);
  // GV re-grades: Q2's key changes, the score goes down.
  const edited = structuredClone(content);
  edited.questions[1].options.forEach((o: any, k: number) => (o.correct = k === 1));
  expect((await saveItem(gv, d.les, setId, 'Bộ theo dõi', edited)).status).toBe(409);
  expect((await saveItem(gv, d.les, setId, 'Bộ theo dõi', edited, { confirmRegrade: true })).status).toBe(200);
  row = await subs();
  expect([row.score, row.submittedAt]).toEqual([1, at]);
  expect((await s11()).score).toBe(1);
  // GV moves the deadline before the submission: late.
  await setDeadline(gv, d.cls, setId, vnToday(-1));
  row = await subs();
  expect([row.late, row.score, row.submittedAt]).toEqual([true, 1, at]);
  expect((await s11()).late).toBe(true);
  expect((await s11()).deadlineLabel).toMatch(/^Hạn nộp \d\d\/\d\d/);
});
