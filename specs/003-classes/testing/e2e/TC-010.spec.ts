import { test, expect } from '@playwright/test';
import { newStudent, newWorkspaceGv, seedCurriculum, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-3.3] [003:AC-3.7] TC-010 khu "Đã chọn", giữ lựa chọn qua tìm kiếm, trang, bước; 0 HV được phép', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const gv = await newWorkspaceGv();
  for (let i = 0; i < 25; i++) await newStudent(gv, `HV ${String.fromCharCode(65 + i)} Chọn`);
  await seedCurriculum(gv, 'TC-010 GT', [{ name: 'Bài 1', steps: 1 }]);
  await page.goto('/');
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-010 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  const list = page.getByRole('group', { name: 'Học viên trong workspace' });
  await list.getByRole('checkbox', { name: 'HV A Chọn' }).check();
  await list.getByRole('checkbox', { name: 'HV B Chọn' }).check();
  await page.getByRole('navigation', { name: 'Phân trang' }).getByRole('button', { name: 'Trang 2' }).click();
  await list.getByRole('checkbox', { name: 'HV Y Chọn' }).check();
  const chosen = page.getByRole('complementary');
  await expect(page.getByRole('heading', { name: 'Đã chọn (3)' })).toBeVisible();
  for (const n of ['HV A Chọn', 'HV B Chọn', 'HV Y Chọn']) {
    await expect(chosen.getByText(n, { exact: true })).toHaveCount(1);
    await expect(chosen.getByRole('button', { name: `Bỏ chọn ${n}` })).toBeVisible();
  }
  await shot(page, 'TC-010', 1);

  await page.getByLabel('Tìm học viên').fill('HV C');
  await expect(list.getByRole('checkbox')).toHaveCount(1);
  await page.getByLabel('Tìm học viên').fill('');
  await expect(list.getByRole('checkbox', { name: 'HV A Chọn' })).toBeChecked();
  await chosen.getByRole('button', { name: 'Bỏ chọn HV B Chọn' }).click();
  await expect(page.getByRole('heading', { name: 'Đã chọn (2)' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đã chọn (2)' })).toBeVisible();
  await expect(list.getByRole('checkbox', { name: 'HV A Chọn' })).toBeChecked();
  await expect(list.getByRole('checkbox', { name: 'HV B Chọn' })).not.toBeChecked();

  await chosen.getByRole('button', { name: 'Bỏ chọn HV A Chọn' }).click();
  await chosen.getByRole('button', { name: 'Bỏ chọn HV Y Chọn' }).click();
  await expect(page.getByRole('heading', { name: 'Đã chọn (0)' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText('Bước 3/4 · Chọn giáo trình', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await shot(page, 'TC-010', 2);
});
