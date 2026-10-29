import { expect, test } from '@playwright/test';
import { evidence, gvPage, openRankingTab, tableRows, tc029Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-10.3] [008:AC-10.4] TC-051 search by name (no accents, spaces trimmed) or e-mail keeps the ranks', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv);
  await openRankingTab(gv, d.A.id);
  const box = gv.getByRole('searchbox', { name: 'Tìm học viên' });
  await expect(box).toHaveAttribute('placeholder', 'Tìm họ tên hoặc email');

  await box.fill('  nguyen van an  ');
  expect((await tableRows(gv)).map((x) => [x.name, x.rank])).toEqual([['Nguyễn Văn An', '1']]);
  await evidence(gv, 'TC-051', 1);
  await box.fill('chi+');
  expect((await tableRows(gv)).map((x) => [x.name, x.rank])).toEqual([['Phạm Thu Chi', '2']]);
  await box.fill('zzz');
  await expect(gv.getByText('Không có học viên nào khớp với “zzz”.')).toBeVisible();
  await evidence(gv, 'TC-051', 2);
  await box.fill('');
  expect((await tableRows(gv)).length).toBe(4);
});
