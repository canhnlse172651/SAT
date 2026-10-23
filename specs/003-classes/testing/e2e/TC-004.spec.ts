import { test, expect } from '@playwright/test';
import { apiAs, ok, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-1.6] TC-004 tải lại T03 hỏi rời trang, dữ liệu không khôi phục', async ({ page }) => {
  const gv = await apiAs('GV');
  const name = `TC-004 Lớp ${uid()}`;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  let asked = false;
  page.on('dialog', async (d) => {
    if (d.type() === 'beforeunload') asked = true;
    await d.accept();
  });
  await page.reload();
  expect(asked).toBe(true);
  await expect(page.getByLabel('Tên lớp')).toHaveValue('');
  await page.goto('/gv/lop-hoc/tao-moi');
  await expect(page.getByLabel('Tên lớp')).toHaveValue('');
  const list = await ok(gv, 'GET', `/classes?status=all&q=${encodeURIComponent(name)}`);
  expect(list.total).toBe(0);
  await shot(page, 'TC-004', 1);
});
