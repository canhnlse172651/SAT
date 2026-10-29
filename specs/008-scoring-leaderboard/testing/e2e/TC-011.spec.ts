/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classRanking, deadlines, devSubmit, gvPage, hvPage, learnRanking, newClass, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-2.4] [008:NFR-3] TC-011 concurrent submissions are all counted once', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b', 'S2a', 'S2b']);
  const { page: hv } = await hvPage(browser, An);

  const res = await Promise.all([
    devSubmit(hv, A.id, r.sets.S1a, 9, 10),
    devSubmit(hv, A.id, r.sets.S1b, 8, 10),
    devSubmit(hv, A.id, r.sets.S2a, 7, 10),
    devSubmit(hv, A.id, r.sets.S2b, 6, 10),
  ]);
  expect(res.map((x) => x.status)).toEqual([200, 200, 200, 200]);

  const mine = (await learnRanking(hv, A.id)).mine;
  const done = mine.sets.filter((s: any) => s.status === 'done');
  expect(new Set(done.map((s: any) => s.id)).size).toBe(4);
  expect(done.length).toBe(4);
  expect([mine.avgEx, mine.nEx, mine.score]).toEqual([75, 4, 22.5]);
  // By hand from the four rows.
  const pts = done.map((s: any) => s.points as number).sort();
  expect(pts).toEqual([60, 70, 80, 90]);
  const avg = Math.round((pts.reduce((a: number, b: number) => a + b, 0) / 4) * 10) / 10;
  expect(avg).toBe(75);
  expect(Math.round(0.3 * avg * 10) / 10).toBe(22.5);

  const gvRow = (await classRanking(gv, A.id)).rows.find((x: any) => x.student.id === An);
  expect([gvRow.avgEx, gvRow.nEx, gvRow.score]).toEqual([mine.avgEx, mine.nEx, mine.score]);
});
