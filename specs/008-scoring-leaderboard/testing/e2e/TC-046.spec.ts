import { expect, test } from '@playwright/test';
import { T04_RANK, call, evidence, gvPage, newClass, otherGvPage, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-9.4] TC-046 another GV sees "Không tìm thấy lớp." on my class\'s ranking tab', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);

  const other = await otherGvPage(browser);
  // 1. Open the tab.
  await other.page.goto(T04_RANK(A.id));
  await expect(other.page.getByText('Không tìm thấy lớp.')).toBeVisible();
  await expect(other.page.getByText(A.name)).toHaveCount(0);
  await evidence(other.page, 'TC-046', 1);
  // 2. The API.
  expect((await call(other.page, 'GET', `/api/classes/${A.id}/ranking`)).status).toBe(404);
});
