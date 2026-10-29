import { expect, test } from '@playwright/test';
import {
  DAY, LESSONS, advanceClock, deadlines, endClass, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1,
  setRow, submitScore, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-5.5] [008:AC-8.6] TC-026 an ended class shows the final board and still counts passed deadlines', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b']);
  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 9, 10);

  // 1. GV ends class A. 2. +24 h. 3. An opens S09.
  await endClass(gv, A.id);
  await advanceClock(gv, DAY);
  await openS09(hv);
  await expect(hv.getByText('Lớp đã kết thúc · Xếp hạng cuối cùng')).toBeVisible();
  await evidence(hv, 'TC-026', 1);
  await myScore(hv);
  const s1b = setRow(hv, LESSONS[0], 'Luyện mẫu câu');
  await expect(s1b).toContainText('Quá hạn');
  await expect(s1b.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(hv, { avgEx: '45,0' });
  await evidence(hv, 'TC-026', 2);
});
