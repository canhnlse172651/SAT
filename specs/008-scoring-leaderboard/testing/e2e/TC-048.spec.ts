import { expect, test } from '@playwright/test';
import { evidence, gvPage, openRankingTab, openS09, pin, tableRows, tc034Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-9.6] TC-048 the own position on S09 matches the GV tab', async ({ browser }) => {
  test.setTimeout(180_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc034Data(browser, gv);
  const hv11 = d.pages[10]!;
  await openS09(hv11);
  await expect(pin(hv11)).toContainText('Hạng 11/12');
  await expect(pin(hv11)).toContainText('13,5');
  await evidence(hv11, 'TC-048', 1);

  await openRankingTab(gv, d.A.id);
  const row = (await tableRows(gv)).find((x) => x.name === d.names[10]);
  expect([row?.rank, row?.score]).toEqual(['11', '13,5']);
  await evidence(gv, 'TC-048', 2);
});
