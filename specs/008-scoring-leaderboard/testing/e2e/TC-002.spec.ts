import { expect, test } from '@playwright/test';
import { LESSONS, deadlines, evidence, gvPage, hvPage, myScore, newClass, openS09, people, r1, setRow, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.2] TC-002 item points are rounded half-up to an integer', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b']);

  const an = await hvPage(browser, An);
  const binh = await hvPage(browser, Bình);
  await submitScore(an.page, A.id, r.sets.S1a, 2, 3);
  await submitScore(binh.page, A.id, r.sets.S1b, 1, 8);

  await openS09(an.page);
  await myScore(an.page);
  const a = setRow(an.page, LESSONS[0], 'Luyện từ mới');
  await expect(a).toContainText('2/3 · 67%');
  await expect(a.locator('.rk-row__pts')).toHaveText('67/100');
  await evidence(an.page, 'TC-002', 1);

  await openS09(binh.page);
  await myScore(binh.page);
  const b = setRow(binh.page, LESSONS[0], 'Luyện mẫu câu');
  await expect(b).toContainText('1/8 · 13%');
  await expect(b.locator('.rk-row__pts')).toHaveText('13/100');
  await evidence(binh.page, 'TC-002', 2);
});
