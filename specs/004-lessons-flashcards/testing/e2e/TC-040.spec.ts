import { expect, test } from '@playwright/test';
import { MB, api, bigPng, gb, freshGvPage, setStorage, upload } from './helpers';

test('[004:AC-5.6] TC-040 two parallel uploads: the one that finishes second is refused', async ({ browser }) => {
  const { page } = await freshGvPage(browser); // own workspace: storage is per workspace
  await setStorage(page, gb(10) - 3 * MB);
  const [a, b] = await Promise.all([
    upload(page, 'image', 'mot.png', bigPng(2 * MB)),
    upload(page, 'image', 'hai.png', bigPng(2 * MB)),
  ]);
  const statuses = [a.status, b.status].sort();
  expect(statuses).toEqual([201, 409]);
  const refused = a.status === 409 ? a : b;
  expect(refused.body.error.message).toMatch(
    /^Không đủ dung lượng lưu trữ \(còn .+\)\. Hãy xóa bớt tệp không dùng trong các bài học\.$/,
  );
  const used = (await api<{ usedBytes: number }>(page, 'GET', '/api/steps/storage')).usedBytes;
  expect(used).toBe(gb(10) - 3 * MB + 2 * MB);
  await setStorage(page, 0);
});
