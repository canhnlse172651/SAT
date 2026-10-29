import { expect, test } from '@playwright/test';
import { boardRows, evidence, gvPage, openS09, tc029Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-6.1] [008:AC-7.4] TC-029 equal scores share a rank (1, 2, 2, 4), medals for 1–3', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv);
  const hv = d.pages.Dũng;
  await openS09(hv);
  const rows = await boardRows(hv);
  expect(rows.map((x) => x.rank)).toEqual(['1', '2', '2', '4']);
  const by = Object.fromEntries(rows.map((x) => [x.name, x]));
  expect([by['Nguyễn Văn An']?.rank, by['Nguyễn Văn An']?.score]).toEqual(['1', '27,0']);
  expect([by['Trần Thị Bình']?.rank, by['Trần Thị Bình']?.score]).toEqual(['2', '24,0']);
  expect([by['Phạm Thu Chi']?.rank, by['Phạm Thu Chi']?.score]).toEqual(['2', '24,0']);
  expect([by['Lê Văn Dũng']?.rank, by['Lê Văn Dũng']?.score]).toEqual(['4', '21,0']);
  // Medals: rank 1 "Vàng", the two rank 2 "Bạc", rank 4 none.
  await expect(hv.locator('.rk-pod', { hasText: 'Nguyễn Văn An' }).locator('.rk-no__medal')).toHaveText('Vàng');
  await expect(hv.locator('.rk-pod', { hasText: 'Trần Thị Bình' }).locator('.rk-no__medal')).toHaveText('Bạc');
  await expect(hv.locator('.rk-pod', { hasText: 'Phạm Thu Chi' }).locator('.rk-no__medal')).toHaveText('Bạc');
  await expect(hv.locator('.rk-lrow', { hasText: 'Lê Văn Dũng' }).locator('.rk-no__medal')).toHaveCount(0);
  await evidence(hv, 'TC-029', 1);
});
