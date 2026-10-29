import { test, expect } from '@playwright/test';
import { writeWorkbook } from '../../../../apps/api/src/modules/accounts/xlsx';
import { newWorkspaceGv, ok, shot, signInLike, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-3.5] TC-012 tối đa 100 HV khi chọn và khi T12 nhập Excel', async ({ page }) => {
  test.setTimeout(300_000);
  const gv = await newWorkspaceGv();
  for (let i = 1; i <= 101; i++)
    await ok(gv, 'POST', '/students', {
      displayName: `HV ${String(i).padStart(3, '0')}`,
      email: `cap${i}+${uid()}@x.dev`,
    });
  await page.goto('/');
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-012 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  const list = page.getByRole('group', { name: 'Học viên trong workspace' });
  const pager = page.getByRole('navigation', { name: 'Phân trang' });
  // Select HV 001 … HV 099 (pages 1–5).
  for (let p = 1; p <= 5; p++) {
    if (p > 1) await pager.getByRole('button', { name: `Trang ${p}` }).click();
    const boxes = list.getByRole('checkbox');
    await expect(boxes.first()).toHaveAccessibleName(`HV ${String((p - 1) * 20 + 1).padStart(3, '0')}`);
    const n = await boxes.count();
    for (let i = 0; i < n; i++) {
      const box = boxes.nth(i);
      const label = await box.getAttribute('aria-label');
      if (label && Number(label.slice(3)) <= 99) await box.check();
    }
  }
  await expect(page.getByRole('heading', { name: 'Đã chọn (99)' })).toBeVisible();
  await list.getByRole('checkbox', { name: 'HV 100' }).check();
  await pager.getByRole('button', { name: 'Trang 6' }).click();
  await list.getByRole('checkbox', { name: 'HV 101' }).click();
  await expect(page.getByRole('heading', { name: 'Đã chọn (100)' })).toBeVisible();
  await expect(list.getByRole('checkbox', { name: 'HV 101' })).not.toBeChecked();
  await expect(page.getByText('Một lớp có tối đa 100 học viên', { exact: true })).toBeVisible();
  await shot(page, 'TC-012', 1);

  // Free 2 seats, then import 5 new students through T12: only 2 are selected.
  const chosen = page.getByRole('complementary');
  await chosen.getByRole('button', { name: 'Bỏ chọn HV 099' }).click();
  await chosen.getByRole('button', { name: 'Bỏ chọn HV 098' }).click();
  await expect(page.getByRole('heading', { name: 'Đã chọn (98)' })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo học viên mới' }).first().click();
  const t12 = page.getByRole('dialog', { name: 'Thêm học viên' });
  await t12.getByRole('tab', { name: 'Import Excel' }).click();
  const xlsx = writeWorkbook([
    {
      name: 'Học viên',
      rows: [
        ['Họ tên', 'Email', 'Số điện thoại', 'Ghi chú'],
        ...Array.from({ length: 5 }, (_, i) => [`Nhập ${i + 1}`, `imp${i + 1}+${uid()}@x.dev`, '', '']),
      ],
    },
  ]);
  await t12.getByLabel('Chọn tệp Excel').setInputFiles({
    name: 'hoc-vien.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(xlsx),
  });
  await t12.getByRole('button', { name: 'Nhập 5 học viên hợp lệ' }).click();
  await expect(page.getByRole('heading', { name: 'Đã chọn (100)' })).toBeVisible();
  await expect(page.getByText('Một lớp có tối đa 100 học viên', { exact: true })).toBeVisible();
  await shot(page, 'TC-012', 2);
});
