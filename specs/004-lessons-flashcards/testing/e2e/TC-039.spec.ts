import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  bigPng,
  chooseFile,
  evidence,
  fileBlock,
  gb,
  freshGvPage,
  newCurriculum,
  newLesson,
  saveStep,
  setStorage,
} from './helpers';

test('[004:AC-5.6] TC-039 a file that would exceed 10 GB is refused; exactly 10 GB is accepted', async ({ browser }) => {
  const { page } = await freshGvPage(browser); // own workspace: storage is per workspace
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Đầy', { goal: '', blocks: [fileBlock('image', null)] });
  await setStorage(page, gb(10) - 1 * MB);
  await page.goto(T07(cur.id, les.id));
  const uploads: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/steps/files')) uploads.push(r.url());
  });
  const block = page.locator('.st-block').nth(0);
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'anh.png',
    mimeType: 'image/png',
    buffer: bigPng(2 * MB),
  });
  await expect(
    block.getByText('Không đủ dung lượng lưu trữ (còn 1 MB). Hãy xóa bớt tệp không dùng trong các bài học.'),
  ).toBeVisible();
  expect(uploads).toEqual([]);
  await expect(page.getByRole('toolbar', { name: 'Phần Bài học' }).getByText('Đã dùng 9,9 GB / 10 GB')).toBeVisible();
  await evidence(page, 'TC-039', 1);

  await setStorage(page, gb(10) - 2 * MB);
  await page.reload();
  await chooseFile(page, page.locator('.st-block').nth(0).getByRole('button', { name: 'Chọn tệp' }), {
    name: 'anh.png',
    mimeType: 'image/png',
    buffer: bigPng(2 * MB),
  });
  await expect(page.locator('.st-block').nth(0).getByRole('button', { name: 'Thay tệp' })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Phần Bài học' }).getByText('Đã dùng 10 GB / 10 GB')).toBeVisible();
  await evidence(page, 'TC-039', 2);
  await setStorage(page, 0);
});
