import { expect, test } from '@playwright/test';
import {
  MB, T09, bigPng, chooseFile, draftSet, evidence, mcq, newCurriculum, newLesson, otherGvPage, set, setBlock, setStorage, storage,
} from './helpers';

test('[005:AC-3.6] TC-028 an image larger than the storage left is refused at once', async ({ browser }) => {
  const { page } = await otherGvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('Câu?', [{ text: 'Một', correct: true }, { text: 'Hai' }])]));
  const quota = (await storage(page)).quotaBytes as number;
  await setStorage(page, quota - 3 * MB);
  await page.goto(T09(cur.id, les.id));
  const q1 = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });
  let uploads = 0;
  page.on('request', (r) => {
    if (r.url().includes('/api/steps/files') && r.method() === 'POST') uploads++;
  });

  // 1. A 4 MB image for option A.
  await chooseFile(page, q1.getByRole('button', { name: 'Thêm ảnh phương án A của câu 1' }), {
    name: 'bon.png',
    mimeType: 'image/png',
    buffer: bigPng(4 * MB),
  });
  await expect(
    q1.getByText('Không đủ dung lượng lưu trữ (còn 3 MB). Hãy xóa bớt tệp không dùng trong các bài học.'),
  ).toBeVisible();
  expect(uploads).toBe(0);
  await expect(q1.getByRole('textbox', { name: 'Phương án A' })).toHaveValue('Một');
  await expect(q1.getByRole('img', { name: 'Hình phương án A của câu 1' })).toHaveCount(0);
  await evidence(page, 'TC-028', 1);
  // 2. An image of exactly 3 MB.
  await chooseFile(page, q1.getByRole('button', { name: /^(Chọn tệp khác|Thêm ảnh phương án A của câu 1)$/ }).first(), {
    name: 'ba.png',
    mimeType: 'image/png',
    buffer: bigPng(3 * MB),
  });
  await expect(q1.getByRole('img', { name: 'Hình phương án A của câu 1' })).toBeVisible();
  await evidence(page, 'TC-028', 2);
});
