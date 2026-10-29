import { expect, test } from '@playwright/test';
import { evidence, gvPage, openS09, removeFromClass, settle, tc038Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-8.2] TC-039 the class viewed last is chosen again, the first one when it is gone', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc038Data(browser, gv);
  const hv = d.an;
  const picker = hv.getByRole('combobox', { name: 'Chọn lớp' });

  // 1. An chooses P on S09.
  await openS09(hv, d.P.id);
  await expect(picker).toHaveValue(d.P.id);
  // 2. S01, then the "Xếp hạng" tab.
  await hv.getByRole('link', { name: 'Lớp của tôi' }).click();
  await expect(hv).toHaveURL(/\/hv\/?$/);
  await hv.getByRole('link', { name: 'Xếp hạng' }).first().click();
  await settle(hv);
  await expect(picker).toHaveValue(d.P.id);
  await evidence(hv, 'TC-039', 1);

  // 3. GV removes An from P; An taps "Xếp hạng" again.
  await removeFromClass(gv, d.P.id, d.An);
  await hv.getByRole('link', { name: 'Lớp của tôi' }).click();
  await hv.getByRole('link', { name: 'Xếp hạng' }).first().click();
  await settle(hv);
  await expect(picker).toHaveValue(d.Q.id);
  await evidence(hv, 'TC-039', 2);
});
