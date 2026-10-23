import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-7.6] [002:AC-7.10] TC-027 thêm mục lưu ngay ở Nháp, Thêm sau, rời T07', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-027 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'B1', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'B2', content: READY_STEP });
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  const step = (k: number) => page.getByRole('region', { name: `Bước học ${k}` });

  await page.getByRole('button', { name: 'Thêm bước học' }).click();
  await expect(page.getByText('Đã thêm bước học mới (Nháp) · Đã lưu', { exact: true })).toBeVisible();
  await expect(step(3).getByLabel('Tên')).toBeFocused();
  await expect(step(3).getByLabel('Tên')).toHaveValue('');
  await expect(step(3).getByLabel('Nội dung khối 1')).toHaveValue('');
  await expect(step(3).getByLabel('Nội dung khối 2')).toHaveCount(0);
  await expect(step(3).getByText('Nháp', { exact: true })).toBeVisible();
  await expect(step(3).getByText('Chưa lưu', { exact: true })).toHaveCount(0);

  await step(1).getByRole('button', { name: 'Thêm sau' }).click();
  await expect(step(2).getByLabel('Tên')).toBeFocused();
  await expect(step(2).getByLabel('Tên')).toHaveValue('');
  await expect(step(3).getByLabel('Tên')).toHaveValue('B2');
  await expect(step(4).getByLabel('Tên')).toHaveValue('');

  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await page.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu', { exact: true })).toBeVisible();
  const set = page.getByRole('region', { name: 'Bộ bài tập 1' });
  await expect(set.getByLabel('Nội dung câu 1')).toHaveValue('');
  await expect(set.getByLabel('Câu 1 · Phương án A')).toBeVisible();
  await expect(set.getByText('Nháp', { exact: true })).toBeVisible();
  await shot(page, 'TC-027', 1);

  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/bai/${l.id}$`));
  const saved = await getLesson(page, l.id);
  const steps = saved.items.filter((i: { section: string }) => i.section === 'lesson');
  expect(steps.map((i: { title: string }) => i.title)).toEqual(['B1', '', 'B2', '']);
  expect(steps.every((i: { status: string }) => i.status === 'draft')).toBe(true);
  expect(saved.items.filter((i: { section: string }) => i.section === 'exercise')).toHaveLength(1);
});
