import { test, expect } from '@playwright/test';
import { addLesson, aiLabel, asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-13.1] TC-013 xóa giáo trình không lớp, không dữ liệu', async ({ page }) => {
  const name = `TC-013 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 1);
  const l1 = await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');
  await aiLabel(page, l1.id, 'review');

  await page.goto(`/gv/giao-trinh/${c.id}`);
  const open = async () => {
    await page.getByRole('button', { name: 'Thao tác giáo trình' }).click();
    await page.getByRole('menuitem', { name: 'Xóa giáo trình' }).click();
    return page.getByRole('alertdialog');
  };
  let dlg = await open();
  await expect(dlg).toContainText(`Xóa giáo trình ${name}?`);
  await expect(dlg).toContainText('Sẽ xóa 2 bài cùng mọi mục. Thao tác không thể hoàn tác.');
  await expect(dlg.getByRole('button', { name: 'Xóa giáo trình' })).toBeVisible();
  await shot(page, 'TC-013', 1);
  await dlg.getByRole('button', { name: 'Hủy' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);

  dlg = await open();
  await dlg.getByRole('button', { name: 'Xóa giáo trình' }).click();
  await expect(page).toHaveURL(/\/gv\/giao-trinh$/);
  await expect(page.getByText('Đã xóa giáo trình', { exact: true })).toBeVisible();
  await page.getByLabel('Tìm giáo trình').fill(name);
  await expect(page.getByRole('link', { name })).toHaveCount(0);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' })).toBeVisible();
  await shot(page, 'TC-013', 2);
});
