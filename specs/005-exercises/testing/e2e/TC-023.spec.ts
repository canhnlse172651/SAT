import { expect, test } from '@playwright/test';
import { T09, chooseFile, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, png, set, setBlock } from './helpers';

test('[005:AC-3.1] TC-023 stem: text, one image, explanation, no audio', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }])]));
  await page.goto(T09(cur.id, les.id));
  const q1 = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });

  // 1. Stem and explanation.
  const stem = q1.getByLabel('Đề bài');
  await stem.fill('你好 nǐ hǎo là gì?');
  await expect(stem).toHaveValue('你好 nǐ hǎo là gì?');
  await expect(stem).toHaveAttribute('maxlength', '2000');
  const why = q1.getByLabel('Giải thích (không bắt buộc)');
  await expect(why).toHaveAttribute('maxlength', '2000');
  await why.fill('你好 = xin chào');
  await setBlock(page, 1).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(page, 1).getByText(/^Đã lưu lúc/)).toBeVisible();
  await page.reload();
  await expect(q1.getByLabel('Đề bài')).toHaveValue('你好 nǐ hǎo là gì?');

  // At most one image on the stem: once attached, only "Thay ảnh".
  await chooseFile(page, q1.getByRole('button', { name: 'Thêm ảnh đề câu 1' }), { name: 'de.png', mimeType: 'image/png', buffer: png() });
  await expect(q1.getByRole('img', { name: 'Hình đề câu 1' })).toBeVisible();
  await expect(q1.getByRole('button', { name: 'Thêm ảnh đề câu 1' })).toHaveCount(0);
  await expect(q1.getByRole('button', { name: 'Thay ảnh đề câu 1' })).toBeVisible();
  // 2. No control to attach audio to the stem or the options.
  await expect(page.getByRole('button', { name: /âm thanh|audio/i })).toHaveCount(0);
  await expect(page.locator('input[type=file][accept*="audio"]')).toHaveCount(0);
  await evidence(page, 'TC-023');
});
