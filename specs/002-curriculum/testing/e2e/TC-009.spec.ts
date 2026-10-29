import { test, expect } from '@playwright/test';
import { asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const png = () => {
  const b = Buffer.alloc(4096, 0);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b);
  return b;
};

test('[002:AC-2.1] [002:AC-2.2] TC-009 sửa thông tin giáo trình, tên trùng bị từ chối', async ({ page }) => {
  const u = uid();
  await asGv(page);
  const c = await createCurriculum(page, `TC-009 Gốc ${u}`, 1);
  await createCurriculum(page, `TC-009 Khác ${u}`, 1);
  await page.goto(`/gv/giao-trinh/${c.id}`);

  const openEdit = async () => {
    await page.getByRole('button', { name: 'Thao tác giáo trình' }).click();
    await page.getByRole('menuitem', { name: 'Sửa thông tin' }).click();
    return page.getByRole('dialog', { name: 'Sửa thông tin giáo trình' });
  };

  let dlg = await openEdit();
  await dlg.getByLabel('Tên').fill(`tc-009 khác ${u}`);
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(dlg.getByText('Tên giáo trình đã tồn tại', { exact: true })).toBeVisible();
  await shot(page, 'TC-009', 1);
  await dlg.getByRole('button', { name: 'Hủy' }).click();
  await expect(page.getByRole('heading', { name: new RegExp(`TC-009 Gốc ${u}`) })).toBeVisible();

  const newName = `TC-009 Đổi tên ${u}`;
  dlg = await openEdit();
  await dlg.getByLabel('Tên').fill(newName);
  await dlg.getByLabel('Mô tả').fill('Mô tả mới');
  await dlg.getByRole('button', { name: 'HSK2', exact: true }).click();
  await dlg.getByLabel('Chọn tệp ảnh bìa').setInputFiles({ name: 'bia.png', mimeType: 'image/png', buffer: png() });
  await expect(dlg.getByRole('img', { name: 'Ảnh bìa đã chọn' })).toBeVisible();
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  const head = page.getByRole('heading', { level: 1 });
  await expect(head).toContainText(newName);
  await expect(head).toContainText('HSK2');
  await expect(page.getByText('Mô tả mới')).toBeVisible();
  await expect(page.getByRole('img', { name: `Ảnh bìa ${newName}` })).toHaveAttribute('src', /\/api\/files\//);
  await shot(page, 'TC-009', 2);

  await page.goto('/gv/giao-trinh');
  await page.getByLabel('Tìm giáo trình').fill(newName);
  const card = page.getByRole('list', { name: 'Danh sách giáo trình' }).getByRole('listitem');
  await expect(card).toHaveCount(1);
  await expect(card.getByText('HSK2', { exact: true }).last()).toBeVisible();
  await expect(card.getByRole('img', { name: `Ảnh bìa ${newName}` })).toBeVisible();

  await card.getByRole('link', { name: newName }).click();
  dlg = await openEdit();
  await dlg.getByRole('button', { name: 'Gỡ ảnh bìa' }).click();
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Ảnh bìa mặc định HSK2' })).toBeVisible();
});
