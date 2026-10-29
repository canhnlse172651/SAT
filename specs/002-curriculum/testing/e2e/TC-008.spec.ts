import { test, expect } from '@playwright/test';
import { createCurriculum, registerGv, shot } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });
test.setTimeout(180_000);

test('[002:AC-3.6] TC-008 phân trang 20 giáo trình, tổng số, T05 ≤ 2 s với 300 giáo trình (NFR-1)', async ({ page }) => {
  await page.goto('/');
  await registerGv(page);
  for (let i = 1; i <= 23; i++) await createCurriculum(page, `TC-008 HSK4 số ${i}`, 4);

  await page.goto('/gv/giao-trinh');
  const cards = page.getByRole('list', { name: 'Danh sách giáo trình' }).getByRole('listitem');
  await expect(cards).toHaveCount(20);
  await expect(page.getByText(/^23 giáo trình · sắp theo cập nhật gần nhất/)).toBeVisible();
  await shot(page, 'TC-008', 1);
  await page.getByRole('navigation', { name: 'Phân trang' }).getByRole('button', { name: 'Trang 2' }).click();
  await expect(cards).toHaveCount(3);

  // NFR-1: 300 curricula, first page within 2 s.
  for (let i = 24; i <= 300; i++) await createCurriculum(page, `TC-008 HSK4 số ${i}`, 4);
  const start = Date.now();
  await page.goto('/gv/giao-trinh');
  await expect(cards).toHaveCount(20);
  const ms = Date.now() - start;
  test.info().annotations.push({ type: 'NFR-1', description: `T05 page 1 with 300 curricula: ${ms} ms` });
  expect(ms).toBeLessThanOrEqual(2000);
});
