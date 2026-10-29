import { expect, test } from '@playwright/test';
import { evidence, gvPage, hvPage, newClass, openS09, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-7.5] TC-035 nobody has points yet', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  await newClass(gv, r.cur, [An, Bình]);
  const { page: hv } = await hvPage(browser, An);
  await openS09(hv);
  await expect(hv.getByText('Chưa có học viên nào có điểm. Hãy làm bài tập để ghi điểm đầu tiên!')).toBeVisible();
  await expect(hv.locator('.rk-pod, .rk-lrow')).toHaveCount(0);
  await evidence(hv, 'TC-035', 1);
});
