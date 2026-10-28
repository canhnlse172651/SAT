/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  ORIGIN, call, classWithSets, doSet, gvPage, hideSection, hvPage, mcq, newClass, otherGvPage, set, setContent, setDeadline,
  vnToday,
} from './helpers';

const SECRET = 'NOI DUNG BI MAT 005';

test('[005:NFR-9] TC-121 every set / attempt / submission endpoint refuses outsiders', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = () => set([mcq(SECRET, [{ text: 'Đúng', correct: true }, { text: 'Sai' }], { explanation: SECRET })]);
  const d = await classWithSets(gv, [{ title: SECRET, content: q() }, { title: 'Chưa mở', content: q(), deadline: null }], {
    students: [],
  });
  const ids = (await (await gv.request.get('/api/students')).json()).items.map((s: any) => s.id) as string[];
  const [owner, other, hiddenHv] = ids as [string, string, string];
  const cls = await newClass(gv, d.cur, [owner, other]);
  const hiddenCls = await newClass(gv, d.cur, [hiddenHv]);
  for (const c of [cls.id, hiddenCls.id]) await setDeadline(gv, c, d.sets[0]!, vnToday(5));
  const x = (await setContent(gv, d.les, d.sets[0]!)).questions[0];
  const own = (await hvPage(browser, owner)).page;
  await doSet(own, cls.id, d.sets[0]!, { [x.id]: { optionIds: [x.options[0].id] } });
  await hideSection(gv, hiddenCls.id, d.les, true);
  const outside = await newClass(gv, d.cur, [owner]);

  const setId = d.sets[0]!;
  const learn = (c: string, s = setId) => `/api/learn/classes/${c}/sets/${s}`;
  const body = { submitKey: 'outsider12345678', answers: {} };
  const learnCalls = (c: string): [string, string, unknown?][] => [
    ['GET', learn(c)],
    ['POST', `${learn(c)}/start`],
    ['PUT', `${learn(c)}/attempt`, { answers: {} }],
    ['POST', `${learn(c)}/submit`, body],
    ['GET', `${learn(c)}/review`],
  ];
  const gvCalls: [string, string, unknown?][] = [
    ['GET', `/api/exercises/submissions?classId=${cls.id}&studentId=${owner}&setId=${setId}`],
    ['GET', `/api/exercises/classes/${cls.id}/sets/${setId}/submissions`],
    ['GET', `/api/exercises/lessons/${d.les}/sets`],
    ['GET', `/api/lessons/${d.les}`],
    ['POST', `/api/lessons/${d.les}/items/${setId}/duplicate`],
    ['PUT', `/api/lessons/${d.les}/items/${setId}`, { expectedVersion: 1, title: 'x', content: q() }],
  ];
  const actors: [string, any][] = [
    ['HV ngoài lớp', (await hvPage(browser, hiddenHv)).page],
    ['HV lớp ẩn phần', (await hvPage(browser, hiddenHv)).page],
    ['HV khác (bài nộp của HV khác)', (await hvPage(browser, other)).page],
    ['GV khác', (await otherGvPage(browser)).page],
  ];
  const anon = await (await browser.newContext({ baseURL: ORIGIN })).newPage();
  const results: string[] = [];
  const check = async (who: string, page: any, calls: [string, string, unknown?][], allowed: number[]) => {
    for (const [m, path, data] of calls) {
      const r = await call(page, m as any, path, data);
      const ok = allowed.includes(r.status) && !JSON.stringify(r.body ?? '').includes(SECRET);
      if (!ok) results.push(`${who}: ${m} ${path} → ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
    }
  };
  await check(actors[0]![0], actors[0]![1], learnCalls(cls.id), [404]);
  await check(actors[1]![0], actors[1]![1], learnCalls(hiddenCls.id), [404]);
  // Another HV of the class: the owner's submission is not reachable (the review is the caller's own: none).
  await check(actors[2]![0], actors[2]![1], gvCalls.slice(0, 2), [404]);
  await check(actors[3]![0], actors[3]![1], [...learnCalls(cls.id), ...gvCalls], [404]);
  await check('Chưa đăng nhập', anon, [...learnCalls(cls.id), ...gvCalls], [401, 403]);
  // HV of the class on the GV endpoints.
  await check('HV (vai trò khác)', own, gvCalls, [404]);
  // A set that is not open creates no attempt.
  const closed = await call(own, 'POST', `${learn(cls.id, d.sets[1]!)}/start`);
  expect(closed.status).toBe(409);
  expect((await call(own, 'GET', learn(cls.id, d.sets[1]!))).body.hasAttempt).toBe(false);
  void outside;
  console.log(`TC-121 refusals not as expected:\n${results.join('\n')}`);
  expect(results).toEqual([]);
});
