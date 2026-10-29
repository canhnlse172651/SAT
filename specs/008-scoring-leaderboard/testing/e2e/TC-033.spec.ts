import { expect, test } from '@playwright/test';
import { HOUR, advanceClock, deadline, evidence, gvPage, hvPage, newClass, openRankingTab, people, r1, refresh, submitScore, tableRow, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-6.6] TC-033 "Cập nhật lần cuối" changes only when the score changes', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);
  await submitScore((await hvPage(browser, An)).page, A.id, r.sets.S1a, 9, 10);

  // 1. T04 tab, note An's "Cập nhật lần cuối".
  await openRankingTab(gv, A.id);
  const row = tableRow(gv, 'Nguyễn Văn An');
  const updated = (await row.locator('td').nth(6).innerText()).trim();
  const score = (await row.locator('td').nth(5).innerText()).trim();
  // 2. +2 h; Hạn nộp of S2a tomorrow. 3. "Làm mới".
  await advanceClock(gv, 2 * HOUR);
  await deadline(gv, A.id, r.sets.S2a, 1);
  await refresh(gv);
  await expect(row.locator('td').nth(6)).toHaveText(updated);
  await expect(row.locator('td').nth(5)).toHaveText(score);
  await evidence(gv, 'TC-033', 1);
});
