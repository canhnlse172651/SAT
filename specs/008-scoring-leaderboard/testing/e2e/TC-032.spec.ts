import { expect, test } from '@playwright/test';
import { deadlines, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, pin, r1, rankingSeg, refresh, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-6.4] [008:AC-6.5] TC-032 one new submission re-ranks the class from all sets since the start', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b']);
  const { page: an } = await hvPage(browser, An);
  const { page: binh } = await hvPage(browser, Bình);
  await submitScore(an, A.id, r.sets.S1a, 8, 10);
  await submitScore(binh, A.id, r.sets.S1a, 7, 10);

  // 1. Bình's S09: "Hạng 2/2".
  await openS09(binh);
  await expect(pin(binh)).toContainText('Hạng 2/2');
  // 2. Bình submits S1b 10/10; "Làm mới".
  await submitScore(binh, A.id, r.sets.S1b, 10, 10);
  await refresh(binh);
  await expect(pin(binh)).toContainText('Hạng 1/2');
  await myScore(binh);
  await expectSummary(binh, { avgEx: '85,0', score: '25,5', rank: 'Hạng 1/2', nEx: 2 });
  await evidence(binh, 'TC-032', 1);
  await rankingSeg(binh);

  // 3. An's S09: rank 2 although An did nothing.
  await openS09(an);
  await expect(pin(an)).toContainText('Hạng 2/2');
  await evidence(an, 'TC-032', 2);
});
