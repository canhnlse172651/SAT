import { expect, test } from '@playwright/test';
import { LESSONS, deadlines, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, setRow, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.4] TC-004 a submission with maximum 0 is left out', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b']);

  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 0, 0);
  await submitScore(hv, A.id, r.sets.S1b, 8, 10);
  await openS09(hv);
  await myScore(hv);
  await expect(setRow(hv, LESSONS[0], 'Luyện từ mới')).toHaveCount(0);
  await expect(setRow(hv, LESSONS[0], 'Luyện mẫu câu')).toHaveCount(1);
  await expectSummary(hv, { avgEx: '80,0', nEx: 1, score: '24,0' });
  await evidence(hv, 'TC-004', 1);
});
