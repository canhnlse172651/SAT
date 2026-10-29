import { expect, test } from '@playwright/test';
import { deadlines, evidence, exam, gvPage, hvPage, myScore, newClass, openS09, people, r1, submitScore, takeExam, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-11.7] TC-056 no "Làm lại" or "Cải thiện điểm" anywhere on "Điểm của tôi"', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b', 'S2a']);
  const X = await exam(gv, [A.id]);
  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 18, 20);
  await submitScore(hv, A.id, r.sets.S1b, 7, 10);
  await submitScore(hv, A.id, r.sets.S2a, 2, 3);
  await takeExam(gv, hv, X.id, 'three');

  await openS09(hv);
  await myScore(hv);
  const page = hv.locator('[data-screen="S09"]');
  await expect(page).toContainText('67/100');
  for (const t of [/làm lại/i, /cải thiện/i, /thử lại bài/i, /nâng điểm/i]) await expect(page.getByText(t)).toHaveCount(0);
  // The only buttons: "Cách tính điểm", the two parts, "Làm mới".
  const names = await page.getByRole('button').evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()));
  expect(names).toEqual(['Cách tính điểm', 'Làm mới']);
  await expect(page.getByRole('radio')).toHaveText(['Xếp hạng', 'Điểm của tôi']);
  // Links are only the rows that open a review (S06 / S08).
  for (const href of await page.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? '')))
    expect(href).toMatch(/\/ket-qua$|\?ket-qua=1$/);
  await evidence(hv, 'TC-056', 1);
});
