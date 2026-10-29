import { expect, test } from '@playwright/test';
import {
  LESSONS, deadline, devSubmit, evidence, gvPage, hvPage, myScore, newClass, openRankingTab, openS09, people, r1, refresh, setRow,
  submitScore, tableRow, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-2.2] [008:AC-2.3] TC-010 a second submission is refused and the score stays', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);
  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 18, 20);

  await openRankingTab(gv, A.id);
  const row = tableRow(gv, 'Nguyễn Văn An');
  const before = (await row.locator('td').nth(6).innerText()).trim();

  // 1. Submit again.
  const again = await devSubmit(hv, A.id, r.sets.S1a, 20, 20);
  expect(again.status).toBe(409);
  expect(again.body.error.message).toBe('Bạn đã nộp bộ bài tập này.');
  // 2. GV "Làm mới".
  await refresh(gv);
  await expect(row.locator('td').nth(3)).toHaveText('90,0');
  await expect(row.locator('td').nth(5)).toHaveText('27,0');
  await expect(row.locator('td').nth(6)).toHaveText(before);
  await evidence(gv, 'TC-010', 1);

  await openS09(hv);
  await myScore(hv);
  await expect(setRow(hv, LESSONS[0], 'Luyện từ mới')).toContainText('18/20 · 90%');
  await evidence(hv, 'TC-010', 2);
});
