import { expect, test } from '@playwright/test';
import { evidence, gvPage, hvPage, people, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-8.4] TC-041 an HV without a class', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const { page: hv } = await hvPage(browser, An);
  await hv.goto('/hv');
  await hv.getByRole('link', { name: 'Xếp hạng' }).first().click();
  await expect(
    hv.getByText('Bạn chưa thuộc lớp nào. Khi giáo viên thêm bạn vào lớp, bảng xếp hạng sẽ hiển thị tại đây.'),
  ).toBeVisible();
  await evidence(hv, 'TC-041', 1);
});
