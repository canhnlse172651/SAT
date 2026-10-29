import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-7.3] [002:AC-7.4] [002:AC-7.2] TC-025 panel Thủ công: tóm tắt theo trạng thái, phần trống', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-025 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  for (const t of ['P1', 'P2', 'P3']) await addItem(page, l.id, 'lesson', { title: t, content: READY_STEP, publish: true });
  await addItem(page, l.id, 'lesson', { title: 'D1', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'A1', content: READY_STEP, archive: true });

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}`);
  const manual = page.getByRole('region', { name: 'Thủ công' });
  const lessonSec = manual.getByRole('region', { name: 'Phần Bài học' });
  await expect(lessonSec).toContainText('5 bước học · 3 đã xuất bản · 1 nháp · 1 lưu trữ');
  await expect(lessonSec.getByText(/^Cập nhật \S+ \S+$/)).toBeVisible();
  const exSec = manual.getByRole('region', { name: 'Phần Bài tập' });
  await expect(exSec).toContainText('Chưa có bộ bài tập nào');
  await expect(manual.getByRole('button', { name: 'Soạn thủ công' })).toHaveCount(1);
  await expect(manual.getByRole('button', { name: 'Mở' })).toHaveCount(0);
  for (const t of ['P1', 'D1', 'A1']) await expect(manual.getByText(t, { exact: true })).toHaveCount(0);
  for (const b of ['Thêm bước học', 'Thêm bộ bài tập', 'Xóa', 'Lên trên', 'Xuống dưới', 'Đổi tên phần']) {
    await expect(manual.getByRole('button', { name: b })).toHaveCount(0);
  }
  await shot(page, 'TC-025', 1);
});
