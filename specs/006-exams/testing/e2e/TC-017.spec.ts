import { expect, test } from '@playwright/test';
import { T10, T22, draftExam, evidence, getExam, gvPage, uid } from './helpers';

test('[006:AC-3.2] TC-017 times are Vietnam time whatever the device zone', async ({ browser }) => {
  const { page } = await gvPage(browser, { timezoneId: 'America/New_York' });
  const t = uid();
  const d = await draftExam(page, { name: `TC-017 ${t}` });
  await page.goto(T22(d.id));
  await page.getByLabel('Giờ mở').fill('20/11/2026 20:00');
  await page.getByLabel('Thời lượng (phút)').fill('45');
  await page.getByLabel('Giờ đóng').fill('20/11/2026 22:00');
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/^Đã lưu lúc/)).toBeVisible();
  const e = await getExam(page, d.id);
  expect(e.opensAt).toBe('2026-11-20T13:00:00.000Z');
  expect(e.closesAt).toBe('2026-11-20T15:00:00.000Z');
  await page.reload();
  await expect(page.getByLabel('Giờ mở')).toHaveValue('20/11/2026 20:00');
  await expect(page.getByLabel('Giờ đóng')).toHaveValue('20/11/2026 22:00');
  await page.goto(T10);
  const row = page.locator('tr', { hasText: `TC-017 ${t}` });
  await expect(row).toContainText('20/11/2026');
  await expect(row).toContainText('20:00');
  await expect(row).toContainText('22:00');
  await evidence(page, 'TC-017');
});
