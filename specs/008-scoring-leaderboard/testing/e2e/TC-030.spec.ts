import { expect, test } from '@playwright/test';
import {
  DAY, advanceClock, deadlines, evidence, gvPage, hideExercises, hvPage, newClass, openRankingTab, people, r1, refresh, relogin,
  submitScore, tableRows, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-6.2] TC-030 inside a tie: who reached the score first, then given name', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const { Bình, Chi } = await people(gv, ['Bình', 'Chi']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [Bình, Chi]);
  await deadlines(gv, A.id, r, ['S1a', 'S3b']);
  // 1. Chi submits S1a 8/10, then Bình 8/10.
  await submitScore((await hvPage(browser, Chi)).page, A.id, r.sets.S1a, 8, 10);
  await submitScore((await hvPage(browser, Bình)).page, A.id, r.sets.S1a, 8, 10);

  // 2. T04 tab: same rank 1, Chi before Bình.
  await openRankingTab(gv, A.id);
  let rows = await tableRows(gv);
  expect(rows.map((x) => [x.name, x.rank])).toEqual([
    ['Phạm Thu Chi', '1'],
    ['Trần Thị Bình', '1'],
  ]);
  await evidence(gv, 'TC-030', 1);

  // 3. +24 h (S3b overdue for both). 4. Hide the Bài tập of Bài 3; "Làm mới".
  await advanceClock(gv, DAY);
  await relogin(gv, 'GV');
  await hideExercises(gv, A.id, r.lessons[2]!);
  await refresh(gv);
  rows = await tableRows(gv);
  expect(rows.map((x) => [x.name, x.rank, x.score])).toEqual([
    ['Trần Thị Bình', '1', '24,0'],
    ['Phạm Thu Chi', '1', '24,0'],
  ]);
  expect(rows[0]!.updated).toBe(rows[1]!.updated);
  await evidence(gv, 'TC-030', 2);
});
