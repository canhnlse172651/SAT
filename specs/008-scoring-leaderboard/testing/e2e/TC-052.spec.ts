import { expect, test } from '@playwright/test';
import { evidence, gvPage, newClass, openRankingTab, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-10.5] TC-052 a class without students', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, []);
  await openRankingTab(gv, A.id);
  await expect(gv.getByText('Lớp chưa có học viên. Thêm học viên ở tab Học viên.')).toBeVisible();
  await expect(gv.locator('.rk-tbl')).toHaveCount(0);
  await evidence(gv, 'TC-052', 1);
});
