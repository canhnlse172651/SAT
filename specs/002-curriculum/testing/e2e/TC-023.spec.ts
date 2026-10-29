import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-6.4] TC-023 lưu thứ tự thất bại thì trả về thứ tự cũ', async ({ page, context }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-023 ${uid()}`, 1);
  const l1 = await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');
  await addLesson(page, c.id, 'Bài 3');
  await addItem(page, l1.id, 'lesson', { title: 'S1', content: READY_STEP });
  await addItem(page, l1.id, 'lesson', { title: 'S2', content: READY_STEP });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  const names = page.locator('.cur-row__name');
  await expect(names).toHaveText(['Bài 1', 'Bài 2', 'Bài 3']);
  await context.setOffline(true);
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Xuống dưới' }).click();
  await expect(page.getByText('Không lưu được thứ tự. Vui lòng thử lại.', { exact: true })).toBeVisible();
  await expect(names).toHaveText(['Bài 1', 'Bài 2', 'Bài 3']);
  await shot(page, 'TC-023', 1);
  await context.setOffline(false);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l1.id}/bai-hoc`);
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên')).toHaveValue('S1');
  await context.setOffline(true);
  await page.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Xuống dưới' }).click();
  await expect(page.getByText('Không lưu được thứ tự. Vui lòng thử lại.', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên')).toHaveValue('S1');
  await expect(page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên')).toHaveValue('S2');
  await shot(page, 'TC-023', 2);
  await context.setOffline(false);
});
