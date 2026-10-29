import { expect, test } from '@playwright/test';
import { api, deadline, evidence, gvPage, hvPage, newClass, openRankingTab, openS09, people, pin, r1, submitScore, tableRows, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-5.3] TC-024 a deleted account leaves the board', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình]);
  await deadline(gv, A.id, r.sets.S1a);
  const { page: an } = await hvPage(browser, An);
  await submitScore(an, A.id, r.sets.S1a, 9, 10);

  // 1. GV deletes Bình's account (001). 2. T04 tab; An's S09.
  await api(gv, 'DELETE', `/api/students/${Bình}`, undefined, 204);
  await openRankingTab(gv, A.id);
  expect((await tableRows(gv)).map((x) => x.name)).toEqual(['Nguyễn Văn An']);
  await evidence(gv, 'TC-024', 1);
  await openS09(an);
  await expect(pin(an)).toContainText('Hạng 1/1');
  await evidence(an, 'TC-024', 2);
});
