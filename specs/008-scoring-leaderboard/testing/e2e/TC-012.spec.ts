import { expect, test } from '@playwright/test';
import { DAY, LESSONS, advanceClock, deadline, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, refresh, setRow, submitScore, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-2.6] [008:AC-11.1] TC-012 a late submission replaces the 0 without a penalty', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);
  const { page: hv } = await hvPage(browser, An);

  // 1. +24 h: "Quá hạn", 0/100.
  await advanceClock(gv, DAY);
  await openS09(hv);
  await myScore(hv);
  const row = setRow(hv, LESSONS[0], 'Luyện từ mới');
  await expect(row).toContainText('Quá hạn');
  await expect(row.locator('.rk-row__pts')).toHaveText('0/100');
  // 2. Late submission 16/20. 3. "Điểm của tôi".
  await submitScore(hv, A.id, r.sets.S1a, 16, 20);
  await refresh(hv);
  await expect(row).toContainText('Đã có điểm');
  await expect(row).toContainText('Nộp muộn');
  await expect(row).toContainText('16/20 · 80%');
  await expect(row.locator('.rk-row__pts')).toHaveText('80/100');
  await expectSummary(hv, { avgEx: '80,0', score: '24,0' });
  await evidence(hv, 'TC-012', 1);
});
