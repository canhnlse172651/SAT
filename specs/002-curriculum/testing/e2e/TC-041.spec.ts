import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, lessonRow, publishLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-10.7] TC-041 Bài đã xuất bản không còn nội dung cho HV thì có cảnh báo', async ({ page }) => {
  const warning = 'Bài đã xuất bản nhưng chưa có nội dung hiển thị cho học viên';
  await asGv(page);
  const c = await createCurriculum(page, `TC-041 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'Duy nhất', content: READY_STEP });
  await publishLesson(page, l.id, [s]);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  await page.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByText('Đã lưu trữ · Đã lưu', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await expect(page.getByText(warning, { exact: true })).toBeVisible();
  await shot(page, 'TC-041', 1);
  await page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: c.name }).click();
  await expect(lessonRow(page, 'Bài 1').getByText(warning)).toBeVisible();

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  await page.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Khôi phục' }).click();
  await expect(page.getByText('Đã khôi phục · Đã lưu', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await expect(page.getByRole('region', { name: 'Thủ công' })).toBeVisible();
  await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: c.name }).click();
  await expect(lessonRow(page, 'Bài 1')).toBeVisible();
  await expect(lessonRow(page, 'Bài 1').getByText(warning)).toHaveCount(0);
});
