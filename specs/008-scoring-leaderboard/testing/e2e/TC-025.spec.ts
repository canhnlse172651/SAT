import { expect, test } from '@playwright/test';
import { boardRows, deadline, evidence, gvPage, hvPage, lockStudent, newClass, openRankingTab, openS09, people, pin, r1, submitScore, tableRows, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-5.4] [008:AC-10.1] TC-025 a locked account stays on the board, labelled for the GV', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình]);
  await deadline(gv, A.id, r.sets.S1a);
  const { page: an } = await hvPage(browser, An);
  await submitScore(an, A.id, r.sets.S1a, 9, 10);
  await submitScore((await hvPage(browser, Bình)).page, A.id, r.sets.S1a, 8, 10);

  // 1. GV locks Bình. 2. T04 tab; An's S09.
  await lockStudent(gv, Bình);
  await openRankingTab(gv, A.id);
  const binh = (await tableRows(gv)).find((x) => x.name === 'Trần Thị Bình')!;
  expect([binh.rank, binh.score, binh.locked]).toEqual(['2', '24,0', true]);
  await evidence(gv, 'TC-025', 1);
  await openS09(an);
  expect((await boardRows(an)).find((x) => x.name === 'Trần Thị Bình')?.rank).toBe('2');
  await expect(pin(an)).toContainText('Hạng 1/2');
  await evidence(an, 'TC-025', 2);
});
