import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-12.1] [002:AC-12.2] TC-049 xóa mục: hộp xác nhận, xóa cả thay đổi chưa lưu, đánh số lại', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-049 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  for (const t of ['S1', 'S2', 'S3']) await addItem(page, l.id, 'lesson', { title: t, content: READY_STEP });
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  const step = (k: number) => page.getByRole('region', { name: `Bước học ${k}` });
  await step(2).getByLabel('Nội dung khối 1').fill('đang sửa dở');
  await expect(page.getByText('1 mục chưa lưu', { exact: true })).toBeVisible();

  await step(2).getByRole('button', { name: 'Xóa' }).click();
  let dlg = page.getByRole('alertdialog');
  await expect(dlg).toContainText('Xóa “S2”?');
  await expect(dlg).toContainText('Thao tác có hiệu lực ngay và không hoàn tác được.');
  await expect(dlg.getByRole('button', { name: 'Xóa' })).toBeVisible();
  await shot(page, 'TC-049', 1);
  await dlg.getByRole('button', { name: 'Hủy' }).click();
  await expect(step(2).getByLabel('Tên')).toHaveValue('S2');

  await step(2).getByRole('button', { name: 'Xóa' }).click();
  dlg = page.getByRole('alertdialog');
  await dlg.getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText('Đã xóa · Đã lưu', { exact: true })).toBeVisible();
  await expect(step(1).getByLabel('Tên')).toHaveValue('S1');
  await expect(step(2).getByLabel('Tên')).toHaveValue('S3');
  await expect(step(3)).toHaveCount(0);
  await expect(page.getByText('1 mục chưa lưu', { exact: true })).toHaveCount(0);
  expect((await getLesson(page, l.id)).items.map((i: { title: string }) => i.title)).toEqual(['S1', 'S3']);
});
