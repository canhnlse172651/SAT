import { test, expect } from '@playwright/test';
import { apiAs, createClass, ok, seedCurriculum, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-2.2] [003:AC-2.3] [003:AC-2.4] TC-006 tên lớp trống, quá dài, trùng (kể cả lớp Đã kết thúc)', async ({
  page,
}) => {
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-006 GT ${uid()}`, [{ name: 'Bài 1', steps: 1 }]);
  const taken = `Lớp Trùng ${uid().toUpperCase()}`;
  const cls = await createClass(gv, { name: taken, curriculumId: cur.id });
  await ok(gv, 'POST', `/classes/${cls.id}/end`);
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  const next = page.getByRole('button', { name: 'Tiếp tục ›' });
  const step1 = page.getByText('Bước 1/4 · Thông tin lớp', { exact: true });

  await page.getByLabel('Tên lớp').fill('   ');
  await next.click();
  await expect(page.getByText('Vui lòng nhập tên lớp', { exact: true })).toBeVisible();
  await expect(step1).toBeVisible();

  await page.getByLabel('Tên lớp').fill('x'.repeat(101));
  await next.click();
  await expect(page.getByText('Tên lớp tối đa 100 ký tự', { exact: true })).toBeVisible();
  await expect(step1).toBeVisible();

  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByLabel('Tên lớp').fill(`  ${taken.toLowerCase()} `);
  await next.click();
  await expect(page.getByText('Tên lớp đã tồn tại', { exact: true })).toBeVisible();
  await expect(step1).toBeVisible();
  await shot(page, 'TC-006', 1);
});
