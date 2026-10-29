import { expect, test } from '@playwright/test';
import { evidence, gvPage, hvPage, newClass, openS09, people, tc038Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-8.1] TC-038 class picker order: Đang học (newest start first), Sắp bắt đầu, Đã kết thúc', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc038Data(browser, gv);
  await openS09(d.an);
  const picker = d.an.getByRole('combobox', { name: 'Chọn lớp' });
  await expect(picker.locator('option')).toHaveText([d.Q.name, d.P.name, d.R.name, d.S.name]);
  await evidence(d.an, 'TC-038', 1);

  // An HV of one class only: no picker.
  const { Bình } = await people(gv, ['Bình']);
  await newClass(gv, d.r.cur, [Bình]);
  const { page: binh } = await hvPage(browser, Bình);
  await openS09(binh);
  await expect(binh.getByRole('combobox', { name: 'Chọn lớp' })).toHaveCount(0);
  await evidence(binh, 'TC-038', 2);
});
