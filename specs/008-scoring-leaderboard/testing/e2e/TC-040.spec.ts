import { expect, test } from '@playwright/test';
import { S02, evidence, gvPage, settle, tc038Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-8.3] TC-040 "Bảng xếp hạng ›" on S02 opens S09 with that class', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc038Data(browser, gv);
  const hv = d.an;
  await hv.goto(S02(d.P.id));
  await hv.getByRole('link', { name: 'Bảng xếp hạng ›' }).click();
  await expect(hv.locator('[data-screen="S09"]')).toBeVisible();
  await settle(hv);
  await expect(hv.getByRole('combobox', { name: 'Chọn lớp' })).toHaveValue(d.P.id);
  await evidence(hv, 'TC-040', 1);
});
