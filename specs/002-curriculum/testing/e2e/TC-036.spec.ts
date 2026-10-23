import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  lessonRow,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-9.6] [002:AC-9.3] TC-036 chỉ có các chuyển trạng thái hợp lệ, không về Nháp', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-036 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const p = await addItem(page, l.id, 'lesson', { title: 'Đã xuất bản', content: READY_STEP });
  await publishLesson(page, l.id, [p]);
  await addItem(page, l.id, 'lesson', { title: 'Nháp sẵn sàng', content: READY_STEP });
  await addItem(page, l.id, 'exercise', { title: 'Lưu trữ', content: READY_SET, archive: true });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Xuất bản bài' })).toHaveCount(0);
  await expect(menu.getByRole('menuitem', { name: /Nháp/ })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  const pub = page.getByRole('region', { name: 'Bước học 1' });
  const draft = page.getByRole('region', { name: 'Bước học 2' });
  await expect(pub.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
  await expect(pub.getByRole('button', { name: 'Lưu trữ' })).toBeVisible();
  await expect(pub.getByRole('button', { name: 'Xuất bản' })).toHaveCount(0);
  await expect(draft.getByRole('button', { name: 'Lưu nháp' })).toBeVisible();
  await expect(draft.getByRole('button', { name: 'Xuất bản' })).toBeVisible();
  await expect(draft.getByRole('button', { name: 'Lưu trữ' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /về Nháp|Chuyển về Nháp|Hủy xuất bản/i })).toHaveCount(0);
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  const arch = page.getByRole('region', { name: 'Bộ bài tập 1' });
  await expect(arch.getByRole('button', { name: 'Khôi phục' })).toBeVisible();
  await expect(arch.getByRole('button', { name: 'Xuất bản' })).toHaveCount(0);
  await shot(page, 'TC-036', 1);

  await page.getByRole('button', { name: 'Xuất bản… (1 Nháp)' }).click();
  const dlg = page.getByRole('dialog', { name: 'Xuất bản “Bài 1”' });
  await expect(dlg.getByRole('checkbox', { name: 'Nháp sẵn sàng' })).toBeChecked();
  await dlg.getByRole('button', { name: 'Xuất bản bài' }).click();
  await expect(page.getByText('Đã xuất bản bài', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /Bài học/ }).click();
  await expect(draft.getByText('Đã xuất bản', { exact: true })).toBeVisible();
});
