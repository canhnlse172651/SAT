/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { DAY, advanceClock, deadlines, gvPage, hvPage, learnRanking, newClass, people, r1, submitScore, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:NFR-1] TC-062 a submission shows within 10 s, an overdue 0 within 60 s', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b']);
  const { page: hv } = await hvPage(browser, An);

  // 1. Submission → new score on the API.
  let t0 = Date.now();
  await submitScore(hv, A.id, r.sets.S1a, 9, 10);
  await expect.poll(async () => (await learnRanking(hv, A.id)).mine.avgEx, { timeout: 10_000, intervals: [200] }).toBe(90);
  const submitMs = Date.now() - t0;
  expect(submitMs).toBeLessThanOrEqual(10_000);

  // 2. +24 h: S1b "Quá hạn" 0.
  await advanceClock(gv, DAY);
  t0 = Date.now();
  await expect
    .poll(async () => (await learnRanking(hv, A.id)).mine.sets.find((s: any) => s.id === r.sets.S1b)?.status, { timeout: 60_000, intervals: [500] })
    .toBe('overdue');
  const overdueMs = Date.now() - t0;
  expect(overdueMs).toBeLessThanOrEqual(60_000);
  test.info().annotations.push({ type: 'timing', description: `submit→visible ${submitMs} ms; overdue→visible ${overdueMs} ms` });
});
