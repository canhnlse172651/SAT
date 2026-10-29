import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-7.12] [002:AC-7.13] TC-030 thay đổi chưa lưu giữ qua tab, hỏi khi rời T07, đường dẫn T09', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-030 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'S1', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'S2', content: READY_STEP });
  await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  const step = (k: number) => page.getByRole('region', { name: `Bước học ${k}` });
  const set1 = page.getByRole('region', { name: 'Bộ bài tập 1' });

  await step(1).getByLabel('Tên').fill('S1 sửa');
  await step(2).getByLabel('Tên').fill('S2 sửa');
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await set1.getByLabel('Tên').fill('E1 sửa');
  await expect(set1.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  await expect(step(1).getByLabel('Tên')).toHaveValue('S1 sửa');
  await expect(step(2).getByLabel('Tên')).toHaveValue('S2 sửa');
  await expect(step(1).getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(step(2).getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Bài học · 2 chưa lưu/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Bài tập · 1 chưa lưu/ })).toBeVisible();

  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  const dlg = page.getByRole('alertdialog');
  await expect(dlg).toContainText('Có 3 mục chưa lưu. Rời trang và bỏ các thay đổi này?');
  await expect(dlg).toContainText('Các thay đổi chưa lưu sẽ bị bỏ; nội dung đã lưu không đổi.');
  await expect(dlg.getByRole('button', { name: 'Rời đi' })).toBeVisible();
  await shot(page, 'TC-030', 1);
  await dlg.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(/\/bai-hoc$/);
  await expect(step(1).getByLabel('Tên')).toHaveValue('S1 sửa');

  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Rời đi' }).click();
  await expect(page).toHaveURL(new RegExp(`/bai/${l.id}$`));
  const saved = await getLesson(page, l.id);
  expect(saved.items.map((i: { title: string }) => i.title)).toEqual(['S1', 'S2', 'E1']);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  await expect(page.getByRole('tab', { name: /^Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  await expect(set1.getByLabel('Tên')).toHaveValue('E1');
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  await expect(step(1).getByLabel('Tên')).toHaveValue('S1');
  await shot(page, 'TC-030', 2);
});
