import { expect, test } from '@playwright/test';
import { MB, T09, bigPng, bmp, chooseFile, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-3.2] TC-024 image type and size', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const q1 = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });
  const refused = q1.getByText('Ảnh phải là JPG, PNG, WebP hoặc GIF, tối đa 5 MB');
  const add = () => q1.getByRole('button', { name: /^(Thêm ảnh đề câu 1|Chọn tệp khác)$/ }).first();

  // 1. BMP.
  await chooseFile(page, add(), { name: 'anh.bmp', mimeType: 'image/bmp', buffer: bmp() });
  await expect(refused).toBeVisible();
  await expect(q1.getByRole('img', { name: 'Hình đề câu 1' })).toHaveCount(0);
  await evidence(page, 'TC-024', 1);
  // 2. PNG of 6 MB.
  await chooseFile(page, add(), { name: 'lon.png', mimeType: 'image/png', buffer: bigPng(6 * MB) });
  await expect(refused).toBeVisible();
  await expect(q1.getByRole('img', { name: 'Hình đề câu 1' })).toHaveCount(0);
  // 3. PNG of 1 MB.
  await chooseFile(page, add(), { name: 'vua.png', mimeType: 'image/png', buffer: bigPng(1 * MB) });
  await expect(q1.getByRole('img', { name: 'Hình đề câu 1' })).toBeVisible();
  await expect(refused).toHaveCount(0);
  await evidence(page, 'TC-024', 2);
});
