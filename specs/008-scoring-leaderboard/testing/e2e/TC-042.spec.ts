import { expect, test } from '@playwright/test';
import { ddmmyyyy, evidence, gvPage, hvPage, newClass, openS09, people, r1, vnDay, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-8.5] TC-042 a class that has not started yet', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const start = await vnDay(gv, 3);
  await newClass(gv, r.cur, [An], { startDate: start });
  const { page: hv } = await hvPage(browser, An);
  await openS09(hv);
  await expect(hv.getByText(`Lớp bắt đầu ngày ${ddmmyyyy(start)}. Bảng xếp hạng sẽ có khi lớp bắt đầu.`)).toBeVisible();
  await expect(hv.locator('.rk-pod, .rk-lrow, .rk-pin')).toHaveCount(0);
  await evidence(hv, 'TC-042', 1);
});
