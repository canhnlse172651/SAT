import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-16.1] [002:AC-16.2] TC-064 công tắc Gồm cả mục Nháp, trạng thái trống', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-064 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'Bước nháp', content: READY_STEP });

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/xem-truoc`);
  await expect(page.getByText('Bài chưa có bước học nào đã xuất bản.', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByText('Bài chưa có bộ bài tập nào đã xuất bản.', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /Bài học/ }).click();

  const sw = page.getByRole('switch', { name: 'Gồm cả mục Nháp' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  const article = page.getByRole('article');
  await expect(article).toHaveCount(1);
  await expect(article).toContainText('Bước nháp');
  await expect(article.getByText('Nháp', { exact: true })).toBeVisible();
  await shot(page, 'TC-064', 1);
  await sw.click();
  await expect(article).toHaveCount(0);

  await sw.click();
  await page.getByRole('button', { name: 'Thoát xem trước' }).click();
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Xem như học viên: Bài 1' }).click();
  await expect(page.getByRole('switch', { name: 'Gồm cả mục Nháp' })).toHaveAttribute('aria-checked', 'false');
});
