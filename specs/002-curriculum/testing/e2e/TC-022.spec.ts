import { test, expect } from '@playwright/test';
import { addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-6.2] [002:AC-6.3] TC-022 sắp xếp bài bằng bàn phím, nút và menu (NFR-5)', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-022 ${uid()}`, 1);
  for (const n of ['Bài 1', 'Bài 2', 'Bài 3', 'Bài 4', 'Bài 5']) await addLesson(page, c.id, n);
  await page.goto(`/gv/giao-trinh/${c.id}`);
  const names = page.locator('.cur-row__name');
  const live = (text: string) => page.getByRole('status').filter({ hasText: new RegExp(`^${text}$`) });

  await page.getByRole('button', { name: 'Kéo để sắp xếp: Bài 1' }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(page.getByText('Đã cập nhật thứ tự', { exact: true })).toBeVisible();
  await expect(names).toHaveText(['Bài 2', 'Bài 3', 'Bài 1', 'Bài 4', 'Bài 5']);
  await expect(live('Vị trí 3 trên 5')).toBeAttached();
  await shot(page, 'TC-022', 1);

  await page.getByRole('button', { name: 'Kéo để sắp xếp: Bài 2' }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(names).toHaveText(['Bài 2', 'Bài 3', 'Bài 1', 'Bài 4', 'Bài 5']);

  await lessonRow(page, 'Bài 3').getByRole('button', { name: 'Lên trên' }).click();
  await expect(names).toHaveText(['Bài 3', 'Bài 2', 'Bài 1', 'Bài 4', 'Bài 5']);
  await expect(live('Vị trí 1 trên 5')).toBeAttached();

  await lessonRow(page, 'Bài 5').getByRole('button', { name: 'Thao tác với Bài 5' }).click();
  await page.getByRole('menuitem', { name: 'Lên đầu' }).click();
  await expect(names).toHaveText(['Bài 5', 'Bài 3', 'Bài 2', 'Bài 1', 'Bài 4']);
  await lessonRow(page, 'Bài 5').getByRole('button', { name: 'Thao tác với Bài 5' }).click();
  await page.getByRole('menuitem', { name: 'Xuống cuối' }).click();
  await expect(names).toHaveText(['Bài 3', 'Bài 2', 'Bài 1', 'Bài 4', 'Bài 5']);
  await expect(live('Vị trí 5 trên 5')).toBeAttached();
  await page.reload();
  await expect(names).toHaveText(['Bài 3', 'Bài 2', 'Bài 1', 'Bài 4', 'Bài 5']);
});
