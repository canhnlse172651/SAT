import { expect, test } from '@playwright/test';
import {
  addToClass, boardRows, deadline, evidence, gvPage, hvPage, newClass, openRankingTab, openS09, people, pin, r1, refresh, removeFromClass,
  submitScore, tableRows, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-5.1] [008:AC-5.2] TC-023 a removed student leaves the board and comes back with the same points', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình, Chi } = await people(gv, ['An', 'Bình', 'Chi']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình, Chi]);
  await deadline(gv, A.id, r.sets.S1a);
  for (const [id, s] of [[An, 9], [Bình, 8], [Chi, 7]] as const) await submitScore((await hvPage(browser, id)).page, A.id, r.sets.S1a, s, 10);

  // 1. GV removes An. 2. Bình's S09 and the GV tab.
  await removeFromClass(gv, A.id, An);
  const { page: binh } = await hvPage(browser, Bình);
  await openS09(binh);
  let rows = await boardRows(binh);
  expect(rows.map((x) => [x.name, x.rank])).toEqual([
    ['Trần Thị Bình', '1'],
    ['Phạm Thu Chi', '2'],
  ]);
  await expect(binh.locator('.rk-pod--1 .rk-no__medal')).toHaveText('Vàng');
  await expect(pin(binh)).toContainText('Hạng 1/2');
  await evidence(binh, 'TC-023', 1);
  await openRankingTab(gv, A.id);
  expect((await tableRows(gv)).map((x) => [x.name, x.rank])).toEqual([
    ['Trần Thị Bình', '1'],
    ['Phạm Thu Chi', '2'],
  ]);
  await evidence(gv, 'TC-023', 2);

  // 3. GV adds An again. 4. Bình "Làm mới".
  await addToClass(gv, A.id, [An]);
  await refresh(binh);
  rows = await boardRows(binh);
  expect(rows.map((x) => [x.name, x.rank, x.score])).toEqual([
    ['Nguyễn Văn An', '1', '27,0'],
    ['Trần Thị Bình', '2', '24,0'],
    ['Phạm Thu Chi', '3', '21,0'],
  ]);
  await expect(pin(binh)).toContainText('Hạng 2/3');
  await evidence(binh, 'TC-023', 3);
});
