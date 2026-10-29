import { test, expect } from '@playwright/test';
import { addItem, addLesson, asGv, createCurriculum, getLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-9.1] [002:AC-9.2] TC-033 xuất bản một mục: chưa hoàn chỉnh bị từ chối, lưu + xuất bản ngay', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-033 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const b1 = await addItem(page, l.id, 'lesson');
  await addItem(page, l.id, 'exercise');
  const before = (await getLesson(page, l.id)).items.find((i: { id: string }) => i.id === b1);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(
    page.getByText('Không thể xuất bản — Chưa hoàn chỉnh: Khối 1 (Văn bản) đang trống', { exact: true }),
  ).toBeVisible();
  await expect(step.getByText('Nháp', { exact: true })).toBeVisible();
  const still = (await getLesson(page, l.id)).items.find((i: { id: string }) => i.id === b1);
  expect(still.version).toBe(before.version);
  expect(still.status).toBe('draft');

  await step.getByLabel('Tên').fill('Chào hỏi');
  await step.getByLabel('Nội dung khối 1').fill('你好 nǐ hǎo — Xin chào');
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText(/^Đã xuất bản · Đã lưu lúc \d{2}:\d{2}$/)).toBeVisible();
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  const published = (await getLesson(page, l.id)).items.find((i: { id: string }) => i.id === b1);
  expect(published.status).toBe('published');
  expect(published.title).toBe('Chào hỏi');
  expect(published.content.blocks[0].text).toBe('你好 nǐ hǎo — Xin chào');
  await shot(page, 'TC-033', 1);

  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await page.getByRole('region', { name: 'Bộ bài tập 1' }).getByRole('button', { name: 'Xuất bản' }).click();
  await expect(
    page.getByText('Không thể xuất bản — Chưa hoàn chỉnh: Câu 1: chưa có nội dung câu hỏi', { exact: true }),
  ).toBeVisible();
});
