import { expect, test } from '@playwright/test';
import { LESSONS, deadline, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, setRow, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.1] [008:AC-1.2] [008:AC-1.6] [008:AC-2.1] [008:AC-11.1] [008:AC-11.2] [008:AC-13.5] TC-001 a submission shows on "Điểm của tôi" with no GV action', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);

  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 18, 20);
  await openS09(hv);
  await myScore(hv);

  const row = setRow(hv, LESSONS[0], 'Luyện từ mới');
  await expect(row).toContainText('Đã có điểm');
  await expect(row).toContainText('18/20 · 90%');
  await expect(row.locator('.rk-row__pts')).toHaveText('90/100');
  await expectSummary(hv, {
    score: '27,0',
    rank: 'Hạng 1/1',
    avgEx: '90,0',
    nEx: 1,
    avgExam: '0,0',
    nExam: 0,
    submitted: '1/1',
    formula: '30% × 90,0 + 70% × 0,0 = 27,0',
  });
  await evidence(hv, 'TC-001', 1);
});
