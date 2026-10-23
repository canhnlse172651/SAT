import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-7.8] TC-028 quay lại T18 thấy tóm tắt mới nhất, tiêu điểm ở Soạn thủ công', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-028 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'B1', content: READY_STEP });
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}`);

  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  await page.getByRole('button', { name: 'Thêm bước học' }).click();
  await expect(page.getByRole('region', { name: 'Bước học 2' })).toBeVisible();
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await page.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();

  const manual = page.getByRole('region', { name: 'Thủ công' });
  await expect(manual.getByRole('region', { name: 'Phần Bài học' })).toContainText('2 bước học · 2 nháp');
  await expect(manual.getByRole('region', { name: 'Phần Bài tập' })).toContainText('2 bộ bài tập · 2 nháp');
  await expect(page.getByRole('button', { name: 'Soạn thủ công' })).toBeFocused();
  await shot(page, 'TC-028', 1);
});
