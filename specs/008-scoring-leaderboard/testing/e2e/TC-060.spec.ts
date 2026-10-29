import { type Page, expect, test } from '@playwright/test';
import {
  MIN, T04, advanceClock, boardRows, evidence, gvPage, newClass, openRankingTab, openS09, refresh, serverNow, settle, submitScore,
  tc029Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

/** "Cập nhật lúc HH:mm · dd/mm/yyyy" for `d` (and the minute before, in case the minute turned). */
const stamps = (d: Date) =>
  [new Date(d.getTime() - MIN), d].map((x) => {
    const v = new Date(x.getTime() + 7 * 3600e3).toISOString();
    return `Cập nhật lúc ${v.slice(11, 16)} · ${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;
  });
const shown = async (p: Page) => (await p.getByText(/^Cập nhật lúc /).innerText()).trim();

test('[008:AC-13.2] [008:AC-13.3] TC-060 "Cập nhật lúc …" is the server time of the data; refresh, class change and reopening load new data', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv, { extraDeadlines: ['S1b'] });
  const B = await newClass(gv, d.r.cur, [d.Dũng]);
  const hv = d.pages.Dũng;

  // 1. Dũng's S09 open: note "Cập nhật lúc".
  await openS09(hv, d.A.id);
  expect(stamps(await serverNow(gv))).toContain(await shown(hv));
  await openRankingTab(gv, d.A.id);
  // 2. +5 min; Bình submits S1b 10/10.
  await advanceClock(gv, 5 * MIN);
  await submitScore(d.pages.Bình, d.A.id, d.r.sets.S1b, 10, 10);
  const later = await serverNow(gv);
  // 3. "Làm mới".
  await refresh(hv);
  expect(stamps(later)).toContain(await shown(hv));
  expect((await boardRows(hv)).find((x) => x.name === 'Trần Thị Bình')?.score).toBe('27,0');
  await evidence(hv, 'TC-060', 1);

  // 4. Change class and back; the GV opens the tab again.
  await advanceClock(gv, MIN);
  await hv.getByRole('combobox', { name: 'Chọn lớp' }).selectOption(B.id);
  await settle(hv);
  await hv.getByRole('combobox', { name: 'Chọn lớp' }).selectOption(d.A.id);
  await settle(hv);
  const third = await serverNow(gv);
  expect(stamps(third)).toContain(await shown(hv));
  await gv.goto(T04(d.A.id));
  await openRankingTab(gv, d.A.id);
  expect(stamps(third)).toContain(await shown(gv));
  await expect(gv.locator('.rk-tbl tbody tr', { hasText: 'Trần Thị Bình' })).toContainText('27,0');
  await evidence(gv, 'TC-060', 2);
});
