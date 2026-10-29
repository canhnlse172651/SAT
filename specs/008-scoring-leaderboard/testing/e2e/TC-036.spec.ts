import { expect, test } from '@playwright/test';
import { evidence, gvPage, openS09, pin, tc029Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-7.6] TC-036 a classmate opens S12, oneself and the pinned row open S10', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv);
  const hv = d.pages.Dũng;
  await openS09(hv);

  // 1. Dũng taps An's name.
  await hv.locator('.rk-pod', { hasText: 'Nguyễn Văn An' }).click();
  await expect(hv).toHaveURL(new RegExp(`/hv/hoc-vien/${d.An}$`));
  await evidence(hv, 'TC-036', 1);
  // 2. Back, own row.
  await hv.goBack();
  await hv.locator('.rk-lrow', { hasText: 'Lê Văn Dũng' }).click();
  await expect(hv).toHaveURL(/\/hv\/ho-so$/);
  // 3. Back, "Vị trí của tôi".
  await hv.goBack();
  await pin(hv).click();
  await expect(hv).toHaveURL(/\/hv\/ho-so$/);
  await evidence(hv, 'TC-036', 2);
});
