import { expect, test } from '@playwright/test';
import {
  HOUR, LESSONS, advanceClock, deadlines, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openRankingTab, openS09, people,
  r1, realSubmit, refresh, regrade, serverNow, setRow, submitScore, tableRows, useClockReset, vnDateTime, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-3.1] [008:AC-3.3] TC-014 a re-grade lowers the score and sets "Cập nhật lần cuối" to the re-grade time', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv, { twoQ: ['S1a'] });
  const A = await newClass(gv, r.cur, [An, Bình]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b']);
  const an = await hvPage(browser, An);
  const binh = await hvPage(browser, Bình);
  await realSubmit(an.page, A.id, r.sets.S1a, r.content.S1a, [0, 0]);
  await submitScore(binh.page, A.id, r.sets.S1b, 5, 10);

  // 1. T04 tab Xếp hạng.
  await openRankingTab(gv, A.id);
  let rows = await tableRows(gv);
  expect(rows.map((x) => [x.name, x.rank, x.score])).toEqual([
    ['Nguyễn Văn An', '1', '30,0'],
    ['Trần Thị Bình', '2', '15,0'],
  ]);
  await evidence(gv, 'TC-014', 1);

  // 2. +1 h; the GV changes the key of question 2 to B and confirms the re-grade.
  await advanceClock(gv, HOUR);
  await regrade(gv, r, 'S1a', 1, 1);
  const done = await serverNow(gv);

  // 3. "Làm mới"; An opens "Điểm của tôi".
  await refresh(gv);
  rows = await tableRows(gv);
  const anRow = rows.find((x) => x.name === 'Nguyễn Văn An')!;
  expect([anRow.rank, anRow.score, anRow.avgEx]).toEqual(['1', '15,0', '50,0']);
  expect(rows.find((x) => x.name === 'Trần Thị Bình')!.rank).toBe('1');
  // The re-grade time (moved clock), as shown in the column.
  const shown = [vnDateTime(new Date(done.getTime() - 60_000)), vnDateTime(done)];
  const asShown = (s: string) => `${s.slice(11)} ${s.slice(0, 10)}`;
  expect(shown.map(asShown)).toContain(anRow.updated);
  await evidence(gv, 'TC-014', 2);

  await openS09(an.page);
  await myScore(an.page);
  const row = setRow(an.page, LESSONS[0], 'Luyện từ mới');
  await expect(row).toContainText('1/2 · 50%');
  await expect(row.locator('.rk-row__pts')).toHaveText('50/100');
  await expectSummary(an.page, { avgEx: '50,0', score: '15,0', rank: 'Hạng 1/2' });
  await evidence(an.page, 'TC-014', 3);
});
