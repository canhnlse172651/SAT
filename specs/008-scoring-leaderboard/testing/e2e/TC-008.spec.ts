import { expect, test } from '@playwright/test';
import { LESSONS, deadline, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, setRow, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.11] [008:AC-11.2] TC-008 only sets with a Hạn nộp are listed', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);

  const { page: hv } = await hvPage(browser, An);
  await openS09(hv);
  await myScore(hv);
  await expect(hv.locator('.rk-bai')).toHaveText([LESSONS[0]]);
  await expect(hv.locator('.rk-mine section[aria-label] .rk-row')).toHaveCount(1);
  await expect(setRow(hv, LESSONS[0], 'Luyện từ mới')).toContainText('Chưa làm');
  await expectSummary(hv, { submitted: '0/1' });
  await evidence(hv, 'TC-008', 1);
});
