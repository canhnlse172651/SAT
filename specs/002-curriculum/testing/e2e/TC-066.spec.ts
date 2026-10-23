import { test, expect } from '@playwright/test';
import { addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-16.6] TC-066 thoát xem trước về đúng vị trí Bài trên T06', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-066 ${uid()}`, 1);
  for (let i = 1; i <= 30; i++) await addLesson(page, c.id, `Bài ${i}`);
  await page.goto(`/gv/giao-trinh/${c.id}`);
  const row = lessonRow(page, 'Bài 25');
  await row.scrollIntoViewIfNeeded();
  await row.getByRole('button', { name: 'Xem như học viên: Bài 25' }).click();
  await expect(page).toHaveURL(/\/xem-truoc$/);
  await page.getByRole('button', { name: 'Thoát xem trước' }).click();
  await expect(page).toHaveURL(new RegExp(`/gv/giao-trinh/${c.id}$`));
  const link = row.getByRole('link', { name: 'Bài 25' });
  await expect(link).toBeFocused();
  await expect(link).toBeInViewport();
  await shot(page, 'TC-066', 1);
});
