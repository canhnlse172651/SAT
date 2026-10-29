/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  DAY, LESSONS, NAMES, activate, advanceClock, api, deadline, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openRankingTab,
  openS09, people, pin, r1, refresh, relogin, setRow, student, submitScore, tableRows, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-5.7] [008:AC-7.2] [008:AC-10.1] TC-028 a student activated after a Hạn nộp gets no 0 for it', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const Ha = await student(gv, NAMES.Hà, { email: `ha+${Date.now()}@sat.dev`, activate: false });
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Ha]);
  await deadline(gv, A.id, r.sets.S1a);
  const { page: an } = await hvPage(browser, An);
  await submitScore(an, A.id, r.sets.S1a, 9, 10);

  // 1. T04 tab: Hà not listed; An "Hạng 1/1".
  await openRankingTab(gv, A.id);
  expect((await tableRows(gv)).map((x) => x.name)).toEqual(['Nguyễn Văn An']);
  await openS09(an);
  await expect(pin(an)).toContainText('Hạng 1/1');
  await evidence(gv, 'TC-028', 1);

  // 2. +24 h. 3. GV activates Hà. 4. Hà opens "Điểm của tôi".
  await advanceClock(gv, DAY);
  await relogin(gv, 'GV');
  await activate(gv, Ha);
  await expect.poll(async () => (await api<any>(gv, 'GET', `/api/students/${Ha}`)).status, { timeout: 15_000 }).toBe('active');
  const { page: ha } = await hvPage(browser, Ha);
  await openS09(ha);
  await myScore(ha);
  await expect(setRow(ha, LESSONS[0], 'Luyện từ mới')).toContainText('Chưa làm');
  await expectSummary(ha, { score: '0,0', rank: 'Chưa có hạng' });
  await evidence(ha, 'TC-028', 2);
  await refresh(an);
  await expect(pin(an)).toContainText('Hạng 1/2');

  // 5. Hạn nộp of S1b today (moved clock); +24 h more; Hà "Làm mới".
  await deadline(gv, A.id, r.sets.S1b);
  await advanceClock(gv, DAY);
  await refresh(ha);
  const s1b = setRow(ha, LESSONS[0], 'Luyện mẫu câu');
  await expect(s1b).toContainText('Quá hạn');
  await expect(s1b.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(ha, { avgEx: '0,0', nEx: 1 });
  await evidence(ha, 'TC-028', 3);
});
