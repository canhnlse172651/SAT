import { expect, test } from '@playwright/test';
import {
  DAY, LESSONS, addToClass, advanceClock, ddmmyyyy, deadline, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09,
  people, r1, refresh, relogin, setRow, submitScore, useClockReset, vnDay, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-5.6] TC-027 a student who joins after a Hạn nộp gets no 0 for it, a late submission counts', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Chi } = await people(gv, ['An', 'Chi']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  const due = await vnDay(gv);
  await deadline(gv, A.id, r.sets.S1a);

  // 1. +24 h. 2. GV adds Chi. 3. Chi opens "Điểm của tôi".
  await advanceClock(gv, DAY);
  await relogin(gv, 'GV');
  await addToClass(gv, A.id, [Chi]);
  const { page: hv } = await hvPage(browser, Chi);
  await openS09(hv);
  await myScore(hv);
  const row = setRow(hv, LESSONS[0], 'Luyện từ mới');
  await expect(row).toContainText('Chưa làm');
  await expect(row).toContainText(`Hạn nộp ${ddmmyyyy(due)}`);
  await expect(row.locator('.rk-row__pts')).toHaveText('—');
  await expectSummary(hv, { score: '0,0', rank: 'Chưa có hạng' });
  await evidence(hv, 'TC-027', 1);

  // 4. Chi submits 8/10 late; "Làm mới".
  await submitScore(hv, A.id, r.sets.S1a, 8, 10);
  await refresh(hv);
  await expect(row).toContainText('Đã có điểm');
  await expect(row).toContainText('Nộp muộn');
  await expect(row.locator('.rk-row__pts')).toHaveText('80/100');
  await expectSummary(hv, { avgEx: '80,0', score: '24,0' });
  await evidence(hv, 'TC-027', 2);
});
