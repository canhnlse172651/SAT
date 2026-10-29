import { expect, test } from '@playwright/test';
import { LESSONS, deadlines, evidence, exam, examRow, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, setRow, submitScore, takeExam, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.5] [008:AC-1.7] [008:AC-1.10] TC-005 exercise and exam averages, weighted and rounded', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b', 'S2a']);
  const X = await exam(gv, [A.id], { name: `TC-005 X ${Date.now()}` });

  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 18, 20);
  await submitScore(hv, A.id, r.sets.S1b, 7, 10);
  await submitScore(hv, A.id, r.sets.S2a, 2, 3);
  await takeExam(gv, hv, X.id, 'three');

  await openS09(hv);
  await myScore(hv);
  await expect(setRow(hv, LESSONS[0], 'Luyện từ mới').locator('.rk-row__pts')).toHaveText('90/100');
  await expect(setRow(hv, LESSONS[0], 'Luyện mẫu câu').locator('.rk-row__pts')).toHaveText('70/100');
  await expect(setRow(hv, LESSONS[1], 'Luyện từ mới').locator('.rk-row__pts')).toHaveText('67/100');
  const x = examRow(hv, X.name);
  await expect(x).toContainText('Đã có điểm');
  await expect(x).toContainText('3/4 · 75%');
  await expect(x.locator('.rk-row__pts')).toHaveText('75/100');
  await expectSummary(hv, {
    avgEx: '75,7',
    nEx: 3,
    avgExam: '75,0',
    nExam: 1,
    formula: '30% × 75,7 + 70% × 75,0 = 75,2',
    score: '75,2',
  });
  // Recomputed by hand from the two shown averages: 0,3 × 75,7 + 0,7 × 75,0 = 75,21 → 75,2.
  expect(Math.round((0.3 * 75.7 + 0.7 * 75) * 10) / 10).toBe(75.2);
  await evidence(hv, 'TC-005', 1);
});
