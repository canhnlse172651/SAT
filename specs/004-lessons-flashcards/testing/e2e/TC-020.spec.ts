import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, text } from './helpers';

const TYPES = [
  'Văn bản',
  'Từ vựng',
  'Ngữ pháp / mẫu câu',
  'Hội thoại / Bài khóa',
  'Bộ thẻ từ vựng',
  'Tài liệu',
  'Video',
  'Hình ảnh',
  'Âm thanh',
];

test('[004:AC-3.1] TC-020 add a block: nine types, at the end, 50 at most', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await addStep(page, les.id);
  const full = await addStep(page, les.id);
  await saveStep(page, les.id, full, 'Đầy', {
    goal: '',
    blocks: Array.from({ length: 50 }, (_, i) => text(`<p>${i}</p>`, `b${i}`)),
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Thêm khối' }).click();
  const menu = step.getByRole('group', { name: 'Chọn loại khối' });
  for (const t of TYPES) await expect(menu.getByRole('button', { name: t, exact: true })).toBeVisible();
  await expect(menu.getByRole('button')).toHaveCount(9);
  await menu.getByRole('button', { name: 'Hình ảnh', exact: true }).click();
  await expect(step.getByText('Khối 2 · Hình ảnh')).toBeVisible();
  await evidence(page, 'TC-020', 1);

  const big = page.getByRole('region', { name: 'Bước học 2' });
  await big.getByRole('button', { name: 'Thêm khối' }).click();
  await expect(big.getByText('Mỗi bước học tối đa 50 khối.')).toBeVisible();
  await expect(big.getByRole('group', { name: 'Chọn loại khối' })).toHaveCount(0);
  await expect(big.getByText(/^Khối \d+ · /)).toHaveCount(50);
  await evidence(page, 'TC-020', 2);
});
