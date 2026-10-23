import { test, expect } from '@playwright/test';
import { asGv, createCurriculum, devClass, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-4.4] TC-012 danh sách Lớp sử dụng', async ({ page }) => {
  await asGv(page);
  const a = await createCurriculum(page, `TC-012a ${uid()}`, 1);
  const b = await createCurriculum(page, `TC-012b ${uid()}`, 1);
  const k1 = await devClass(page, b.id, 'Lớp K1', { status: 'active', startDate: '2026-10-01' });
  await devClass(page, b.id, 'Lớp K2', { status: 'upcoming', startDate: '2026-12-01' });

  await page.goto(`/gv/giao-trinh/${a.id}`);
  await page.getByRole('button', { name: 'Dùng bởi 0 lớp' }).click();
  await expect(page.getByRole('dialog', { name: 'Lớp sử dụng' }).getByText('Chưa có lớp nào.')).toBeVisible();

  await page.goto(`/gv/giao-trinh/${b.id}`);
  await page.getByRole('button', { name: 'Dùng bởi 2 lớp' }).click();
  const pop = page.getByRole('dialog', { name: 'Lớp sử dụng' });
  const k1Link = pop.getByRole('link', { name: /Lớp K1/ });
  await expect(k1Link).toContainText('Đang học');
  await expect(k1Link).toContainText('Bắt đầu 01/10/2026');
  const k2Link = pop.getByRole('link', { name: /Lớp K2/ });
  await expect(k2Link).toContainText('Sắp bắt đầu');
  await expect(k2Link).toContainText('Bắt đầu 01/12/2026');
  await shot(page, 'TC-012', 1);
  await k1Link.click();
  await expect(page).toHaveURL(new RegExp(`/gv/lop-hoc/${k1.id}\\?tab=noi-dung$`));
});
