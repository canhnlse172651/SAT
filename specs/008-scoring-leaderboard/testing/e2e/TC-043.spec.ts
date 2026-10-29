/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { api, deadline, exam, gvPage, hideExercises, learnRanking, submitScore, takeExam, tc034Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-9.1] [008:NFR-7] TC-043 the HV receives only names and scores of others, nothing of hidden content', async ({ browser }) => {
  test.setTimeout(240_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc034Data(browser, gv);
  // Plus: a submitted exam, and S2a (Bài 2) with submissions, then its Bài tập section hidden.
  const X = await exam(gv, [d.A.id], { name: `TC-043 X ${Date.now()}` });
  await deadline(gv, d.A.id, d.r.sets.S2a);
  for (const [k, p] of d.pages.entries()) {
    await submitScore(p, d.A.id, d.r.sets.S2a, 10 - (k % 5), 10);
    if (k < 6) await takeExam(gv, p, X.id, k % 2 ? 'one' : 'three');
  }
  await hideExercises(gv, d.A.id, d.r.lessons[1]!);

  // 1. HV 11 calls the API. 2. The whole body.
  const hv11 = d.pages[10]!;
  const body = await learnRanking(hv11, d.A.id);
  const text = JSON.stringify(body);
  expect(body.top).toHaveLength(10);
  for (const row of body.top) expect(Object.keys(row).sort()).toEqual(['id', 'me', 'name', 'rank', 'score']);
  expect(d.names).toEqual(expect.arrayContaining(body.top.map((r: any) => r.name)));
  // No e-mail, averages, details or account state of anybody.
  expect(text).not.toMatch(/@sat\.dev/);
  expect(text).not.toMatch(/"(email|locked|accountStatus|activatedAt)":/);
  for (const k of ['avgEx', 'avgExam', 'nEx', 'nExam', 'sets', 'exams']) for (const row of body.top) expect(row).not.toHaveProperty(k);
  // Other students' ids appear only in `top`.
  const others = d.ids.filter((id) => id !== d.ids[10]);
  const withoutTop = JSON.stringify({ ...body, top: undefined });
  for (const id of others) expect(withoutTop).not.toContain(id);
  // "Điểm của tôi" is HV 11's own; nothing of the hidden section but k and S.
  const own = await api<any>(gv, 'GET', `/api/classes/${d.A.id}/ranking/${d.ids[10]}`);
  expect([body.mine.score, body.mine.avgEx, body.mine.avgExam, body.mine.nEx]).toEqual([own.score, own.avgEx, own.avgExam, own.nEx]);
  expect(body.me.score).toBe(own.score);
  expect(body.mine.sets.some((s: any) => s.lessonId === d.r.lessons[1])).toBe(false);
  expect(text).not.toContain(d.r.sets.S2a);
  expect(text).not.toContain('Bài 2 – 谢谢');
  expect(Object.keys(body.mine.hidden).sort()).toEqual(['k', 'sum']);
  expect(body.mine.hidden.k).toBe(1);
});
