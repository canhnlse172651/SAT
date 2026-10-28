/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  advanceClock, api, call, clockTo, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet,
  resetClock, saveAnswers, set, setContent, setDeadline, start, studentIds, submit, vnToday,
} from './helpers';

test('[005:NFR-14] TC-125 deadline edge cases in two classes', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const setId = await publishedSet(gv, les.id, 'Bộ biên', set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]));
  await publishLesson(gv, les.id);
  const [h1, h2, h3] = await studentIds(gv);
  const A = await newClass(gv, cur.id, [h1!, h2!]);
  const B = await newClass(gv, cur.id, [h3!]);
  const dA = vnToday(2);
  const dB = vnToday(4);
  await setDeadline(gv, A.id, setId, dA);
  await setDeadline(gv, B.id, setId, dB);
  const q = (await setContent(gv, les.id, setId)).questions[0];
  const ans = { [q.id]: { optionIds: [q.options[0].id] } };
  const p1 = (await hvPage(browser, h1!)).page;
  const p2 = (await hvPage(browser, h2!)).page;
  const p3 = (await hvPage(browser, h3!)).page;
  for (const [p, c] of [[p1, A.id], [p2, A.id], [p3, B.id]] as const) {
    await start(p, c, setId);
    await saveAnswers(p, c, setId, ans);
  }
  const state = async (p: typeof gv, c: string) => (await call(p, 'GET', `/api/learn/classes/${c}/sets/${setId}`)).body.set;
  const subs = async (c: string) => (await api<any>(gvFresh, 'GET', `/api/exercises/classes/${c}/sets/${setId}/submissions`)).items;
  let gvFresh = gv;
  const errors: string[] = [];
  const check = (what: string, got: unknown, want: unknown) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  };
  try {
    // 23:59:59 of A's deadline: HV1 on time; HV2 still "Đang làm", "Hạn hôm nay"; B unaffected.
    await clockTo(p1, `${dA}T23:59:59.000+07:00`);
    await submit(p1, A.id, setId, ans);
    const s2 = await state(p2, A.id);
    check('A HV2 at 23:59:59', [s2.status, s2.deadlineLabel], ['doing', 'Hạn hôm nay']);
    // 00:00:00: HV2 overdue (attempt in progress), then submits late; B still "Đang làm".
    await advanceClock(p1, 1000);
    check('A HV2 at 00:00:00', (await state(p2, A.id)).status, 'overdue');
    check('B HV3 at A+1', (await state(p3, B.id)).status, 'doing');
    await submit(p2, A.id, setId, ans);
    gvFresh = (await gvPage(browser)).page;
    const t0 = Date.now();
    const a = await subs(A.id);
    check('A submissions late', a.map((i: any) => [i.student.id, i.late]).sort(), [[h1, false], [h2, true]].sort());
    check('009 data within 5 s', Date.now() - t0 <= 5000, true);
    // Change A's deadline to B's: nobody late; clear it: no late / overdue, HV statuses "Đã hoàn thành".
    await setDeadline(gvFresh, A.id, setId, dB);
    check('A after change', (await subs(A.id)).map((i: any) => i.late), [false, false]);
    await setDeadline(gvFresh, A.id, setId, null);
    check('A after clear', (await subs(A.id)).map((i: any) => i.late), [false, false]);
    check('A HV1 after clear', (await state(p1, A.id)).status, 'done');
    // B: an attempt past its deadline.
    await clockTo(p3, `${dB}T23:59:59.500+07:00`);
    await advanceClock(p3, 1000);
    const s3 = await state(p3, B.id);
    check('B HV3 past deadline', [s3.status, s3.deadlineLabel], ['overdue', `Hạn nộp ${dB.slice(8, 10)}/${dB.slice(5, 7)}`]);
  } finally {
    await resetClock(p1);
  }
  expect(errors).toEqual([]);
});
