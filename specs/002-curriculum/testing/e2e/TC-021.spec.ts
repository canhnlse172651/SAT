import { test, expect } from '@playwright/test';
import { addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-6.1] [002:AC-6.3] TC-021 kéo-thả bài, thả ra ngoài thì về chỗ cũ', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-021 ${uid()}`, 1);
  for (const n of ['Bài 1', 'Bài 2', 'Bài 3', 'Bài 4']) await addLesson(page, c.id, n);
  await page.goto(`/gv/giao-trinh/${c.id}`);
  const names = page.locator('.cur-row__name');
  await expect(names).toHaveText(['Bài 1', 'Bài 2', 'Bài 3', 'Bài 4']);

  await page.getByRole('button', { name: 'Kéo để sắp xếp: Bài 4' }).dragTo(lessonRow(page, 'Bài 1'));
  await expect(page.getByText('Đã cập nhật thứ tự', { exact: true })).toBeVisible();
  await expect(names).toHaveText(['Bài 4', 'Bài 1', 'Bài 2', 'Bài 3']);
  await expect(page.locator('.cur-row__ord')).toHaveText(['1', '2', '3', '4']);
  await shot(page, 'TC-021', 1);
  await page.reload();
  await expect(names).toHaveText(['Bài 4', 'Bài 1', 'Bài 2', 'Bài 3']);

  // Released outside the list: back where it was, nothing saved.
  await page.getByRole('button', { name: 'Kéo để sắp xếp: Bài 2' }).dragTo(page.getByRole('heading', { level: 1 }));
  await expect(names).toHaveText(['Bài 4', 'Bài 1', 'Bài 2', 'Bài 3']);
  await page.reload();
  await expect(names).toHaveText(['Bài 4', 'Bài 1', 'Bài 2', 'Bài 3']);
});
