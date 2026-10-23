import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-6.5] [002:AC-6.6] [002:AC-8.1] TC-024 Lên/Xuống trong T07, kể cả mục lưu trữ đang ẩn', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-024 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'B1', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'B2', content: READY_STEP, archive: true });
  await addItem(page, l.id, 'lesson', { title: 'B3', content: READY_STEP });
  await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  await addItem(page, l.id, 'exercise', { title: 'E2', content: READY_SET });

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  const step = (k: number) => page.getByRole('region', { name: `Bước học ${k}` });
  await expect(step(1).getByLabel('Tên')).toHaveValue('B1');
  await expect(step(1).getByRole('button', { name: 'Lên trên' })).toBeDisabled();
  await expect(step(2)).toHaveCount(0); // archived B2 hidden
  await expect(step(3).getByLabel('Tên')).toHaveValue('B3');

  await step(3).getByRole('button', { name: 'Lên trên' }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 2/3 · Đã lưu', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: /^Đã chuyển tới vị trí 2\/3 · Đã lưu$/ }),
  ).not.toHaveCount(0);
  await expect(step(2).getByLabel('Tên')).toHaveValue('B3');

  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  await expect(step(1).getByLabel('Tên')).toHaveValue('B1');
  await expect(step(2).getByLabel('Tên')).toHaveValue('B3');
  await expect(step(3).getByLabel('Tên')).toHaveValue('B2');
  await expect(step(3).getByText('Lưu trữ', { exact: true }).first()).toBeVisible();
  await expect(step(3).getByRole('button', { name: 'Xuống dưới' })).toBeDisabled();
  await shot(page, 'TC-024', 1);

  await page.reload();
  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  await expect(step(2).getByLabel('Tên')).toHaveValue('B3');
  await expect(step(3).getByLabel('Tên')).toHaveValue('B2');
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 1' }).getByLabel('Tên')).toHaveValue('E1');
  await expect(page.getByRole('region', { name: 'Bộ bài tập 2' }).getByLabel('Tên')).toHaveValue('E2');
});
