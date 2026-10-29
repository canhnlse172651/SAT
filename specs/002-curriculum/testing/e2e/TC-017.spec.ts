import { test, expect } from '@playwright/test';
import { asGv, createCurriculum, ok, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-13.6] TC-017 khôi phục giáo trình đã lưu trữ', async ({ page }) => {
  const name = `TC-017 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 1);
  await ok(page, 'POST', `/curricula/${c.id}/archive`);

  await page.goto('/gv/giao-trinh');
  await page.getByRole('switch', { name: 'Đã lưu trữ' }).click();
  await page.getByLabel('Tìm giáo trình').fill(name);
  await page.getByRole('button', { name: `Khôi phục ${name}` }).click();
  await expect(page.getByText('Đã khôi phục giáo trình.', { exact: true })).toBeVisible();
  await shot(page, 'TC-017', 1);

  await page.getByRole('switch', { name: 'Đã lưu trữ' }).click();
  await expect(page.getByRole('link', { name })).toBeVisible();
  const selectable = await page.request
    .get('/api/curricula?selectable=true&q=' + encodeURIComponent(name))
    .then((r) => r.json());
  expect(selectable.total).toBe(1);
});
