import { expect, test } from '@playwright/test';
import { evidence, gvPage, hvPage, myScore, newClass, openS09, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-11.6] [008:AC-11.9] TC-055 nothing to count yet', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  await newClass(gv, r.cur, [An]);
  const { page: hv } = await hvPage(browser, An);
  await openS09(hv);
  await myScore(hv);
  await expect(hv.getByText('Lớp chưa có bài tập nào để tính điểm.')).toBeVisible();
  await expect(hv.getByText('Lớp chưa có bài thi nào.')).toBeVisible();
  await evidence(hv, 'TC-055', 1);
});
