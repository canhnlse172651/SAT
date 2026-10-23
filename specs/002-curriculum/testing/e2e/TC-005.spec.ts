import { test, expect } from '@playwright/test';
import { asGv, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const png = (size: number) => {
  const b = Buffer.alloc(size, 0);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b);
  return b;
};
const jpg = (size: number) => {
  const b = Buffer.alloc(size, 0);
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(b);
  return b;
};

test('[002:AC-1.6] [002:AC-1.2] TC-005 ảnh bìa: sai định dạng, quá 2 MB, PNG hợp lệ', async ({ page }) => {
  const name = `TC-005 ${uid()}`;
  const message = 'Ảnh bìa phải là JPG, PNG hoặc WebP, tối đa 2 MB';
  await asGv(page);
  await page.goto('/gv/giao-trinh');
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await dlg.getByLabel('Tên').fill(name);
  await dlg.getByRole('button', { name: 'HSK1', exact: true }).click();
  await dlg.getByLabel('Mô tả').fill('abc');
  const file = dlg.getByLabel('Chọn tệp ảnh bìa');

  await file.setInputFiles({ name: 'anh.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a......') });
  await expect(dlg.getByText(message, { exact: true })).toBeVisible();
  await expect(dlg.getByLabel('Tên')).toHaveValue(name);
  await expect(dlg.getByLabel('Mô tả')).toHaveValue('abc');
  await expect(dlg.getByRole('button', { name: 'HSK1', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await file.setInputFiles({ name: 'to.jpg', mimeType: 'image/jpeg', buffer: jpg(2.5 * 1024 * 1024) });
  await expect(dlg.getByText(message, { exact: true })).toBeVisible();
  await expect(dlg.getByLabel('Tên')).toHaveValue(name);
  await shot(page, 'TC-005', 1);

  await file.setInputFiles({ name: 'bia.png', mimeType: 'image/png', buffer: png(50 * 1024) });
  await expect(dlg.getByRole('img', { name: 'Ảnh bìa đã chọn' })).toBeVisible();
  await expect(dlg.getByText(message, { exact: true })).toHaveCount(0);
  await dlg.getByRole('button', { name: 'Tạo giáo trình' }).click();
  await expect(page.getByText('Đã tạo giáo trình', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: `Ảnh bìa ${name}` })).toHaveAttribute('src', /\/api\/files\//);
  await shot(page, 'TC-005', 2);

  await page.goto('/gv/giao-trinh');
  await page.getByLabel('Tìm giáo trình').fill(name);
  await expect(page.getByRole('img', { name: `Ảnh bìa ${name}` })).toHaveAttribute('src', /\/api\/files\//);
});
