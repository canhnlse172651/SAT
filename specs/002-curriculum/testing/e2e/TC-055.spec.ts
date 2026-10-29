import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-18.3] TC-055 mục lưu trữ: tính trong tóm tắt, ẩn mặc định, sửa được', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-055 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'B1', content: READY_STEP, publish: true });
  const b2 = await addItem(page, l.id, 'lesson', { title: 'B2', content: READY_STEP, archive: true });

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}`);
  await expect(page.getByRole('region', { name: 'Phần Bài học' })).toContainText('2 bước học · 1 đã xuất bản · 1 lưu trữ');

  await page.getByRole('button', { name: 'Soạn thủ công' }).click();
  const sw = page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('region', { name: 'Bước học 2' })).toHaveCount(0);
  await sw.click();
  const r2 = page.getByRole('region', { name: 'Bước học 2' });
  await expect(r2.getByLabel('Tên')).toHaveValue('B2');
  await expect(r2.getByText('Lưu trữ', { exact: true }).first()).toBeVisible();
  await r2.getByLabel('Tên').fill('B2 sửa');
  await r2.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/^Đã lưu lúc \d{2}:\d{2}$/).first()).toBeVisible();
  await shot(page, 'TC-055', 1);
  const saved = (await getLesson(page, l.id)).items.find((i: { id: string }) => i.id === b2);
  expect([saved.title, saved.status]).toEqual(['B2 sửa', 'archived']);

  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('switch', { name: /Hiện mục lưu trữ/ })).toHaveCount(0);
});
