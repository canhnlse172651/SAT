import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, getExam, gvPage } from './helpers';

test('[006:AC-3.2] TC-018 an impossible date-time and a non-number duration are refused under their fields', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page);
  const v0 = (await getExam(page, d.id)).version;
  await page.goto(T22(d.id));
  await page.getByLabel('Giờ mở').fill('31/02/2026 20:00');
  await page.getByLabel('Thời lượng (phút)').fill('abc');
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByLabel('Giờ mở')).toHaveAccessibleDescription(/Ngày giờ không hợp lệ — nhập dạng dd\/mm\/yyyy hh:mm/);
  await expect(page.getByLabel('Thời lượng (phút)')).toHaveAccessibleDescription(/Thời lượng phải là số nguyên từ 1 đến 300 phút/);
  expect((await getExam(page, d.id)).version).toBe(v0);
  await evidence(page, 'TC-018');
});
