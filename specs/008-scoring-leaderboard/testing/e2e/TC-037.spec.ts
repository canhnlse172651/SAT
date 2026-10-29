import { expect, test } from '@playwright/test';
import { evidence, gvPage, myScore, openS09, tc029Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-7.7] TC-037 S09 has exactly two parts and no score history', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv);
  const hv = d.pages.An;
  await openS09(hv);
  const seg = hv.getByRole('radiogroup', { name: 'Mục' });
  await expect(seg.getByRole('radio')).toHaveText(['Xếp hạng', 'Điểm của tôi']);
  const none = async () => {
    for (const t of ['Lịch sử điểm', '7 ngày qua', 'Thay đổi điểm', 'Biến động'])
      await expect(hv.getByText(t)).toHaveCount(0);
  };
  await none();
  await myScore(hv);
  await none();
  await evidence(hv, 'TC-037', 1);
});
