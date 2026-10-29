import { expect, test } from '@playwright/test';
import { boardRows, evidence, gvPage, openS09, pin, tc034Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-7.1] [008:AC-7.2] TC-034 at most 10 ranks are shown, own position pinned', async ({ browser }) => {
  test.setTimeout(180_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc034Data(browser, gv);

  // 1. HV 11 opens S09.
  const hv11 = d.pages[10]!;
  await openS09(hv11);
  const rows = await boardRows(hv11);
  expect(rows.length).toBe(10);
  expect(rows.map((x) => x.rank)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  expect(rows.map((x) => x.name)).toEqual(d.names.slice(0, 10));
  // 100 − 5k → 0,3 × that, one decimal.
  expect(rows.map((x) => x.score)).toEqual(['28,5', '27,0', '25,5', '24,0', '22,5', '21,0', '19,5', '18,0', '16,5', '15,0']);
  // Each row: rank, avatar (initial without a photo), name, score.
  await expect(hv11.locator('.rk-pod .avatar, .rk-lrow .avatar')).toHaveCount(10);
  await expect(hv11.locator('.rk-lrow .avatar').first()).toHaveText(/^\S{1,2}$/);
  await expect(pin(hv11)).toContainText('Hạng 11/12');
  await expect(pin(hv11)).toContainText('13,5');
  await evidence(hv11, 'TC-034', 1);

  // HV 3 (podium) and HV 5 (list) see their own row highlighted.
  await openS09(d.pages[2]!);
  await expect(d.pages[2]!.locator('.rk-pod--3 .rk-pod__name')).toContainText('(bạn)');
  await evidence(d.pages[2]!, 'TC-034', 2);
  await openS09(d.pages[4]!);
  await expect(d.pages[4]!.locator('.rk-lrow--me')).toHaveCount(1);
  await expect(d.pages[4]!.locator('.rk-lrow--me')).toContainText(d.names[4]!);
  await expect(d.pages[4]!.locator('.rk-lrow--me')).toContainText('Bạn');
});
