import { test, expect } from '@playwright/test';
import { addLesson, aiLabel, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-12.7] TC-053 xóa bài có nội dung AI chờ duyệt', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-053 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài AI');
  await aiLabel(page, l.id, 'review');

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài AI').getByRole('button', { name: 'Thao tác với Bài AI' }).click();
  await page.getByRole('menuitem', { name: 'Xóa bài' }).click();
  const dlg = page.getByRole('alertdialog');
  await expect(dlg).toContainText('Bài có nội dung AI đang tạo hoặc chờ duyệt. Xóa bài sẽ hủy nội dung này.');
  await shot(page, 'TC-053', 1);
  await dlg.getByRole('button', { name: 'Xóa bài' }).click();
  await expect(page.getByText('Đã xóa bài', { exact: true })).toBeVisible();
  await expect(lessonRow(page, 'Bài AI')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^AI · / })).toHaveCount(0);
  expect((await page.request.get(`/api/lessons/${l.id}`)).status()).toBe(404);
});
