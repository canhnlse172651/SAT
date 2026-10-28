/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  MB, T07, api, bigPng, draftSet, evidence, itemOf, mcq, newCurriculum, newLesson, otherGvPage, saveItem, set, setStorage,
  storage, upload,
} from './helpers';

test('[005:AC-3.5] TC-027 question images count once in the storage', async ({ browser }) => {
  // A workspace of its own: the storage figure must not move with other cases.
  const { page } = await otherGvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const used = async () => (await storage(page)).usedBytes as number;
  const u = await used();
  const q = (image: unknown = null) => mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }], { image });
  const a = await draftSet(page, les.id, 'Bộ A', set([q()]));
  const b = await draftSet(page, les.id, 'Bộ B', set([q()]));

  // 1. A 1 MB image on a question of A, saved.
  const img = (await upload(page, 'anh.png', bigPng(1 * MB))).body;
  expect((await saveItem(page, les.id, a, 'Bộ A', set([q(img)]))).status).toBe(200);
  expect(await used()).toBe(u + 1 * MB);
  // 2. The same image on another question of A and on B.
  expect((await saveItem(page, les.id, a, 'Bộ A', set([q(img), q(img)]))).status).toBe(200);
  expect((await saveItem(page, les.id, b, 'Bộ B', set([q(img)]))).status).toBe(200);
  expect(await used()).toBe(u + 1 * MB);
  // 3. "Nhân bản" A.
  const copy = await api<any>(page, 'POST', `/api/lessons/${les.id}/items/${a}/duplicate`);
  const copyId: string = copy.itemId ?? copy.id ?? copy.item?.id;
  expect(copyId).toBeTruthy();
  expect(await used()).toBe(u + 1 * MB);
  // 4. Remove the image from A and B, delete the copy.
  expect((await saveItem(page, les.id, a, 'Bộ A', set([q(), q()]))).status).toBe(200);
  expect((await saveItem(page, les.id, b, 'Bộ B', set([q()]))).status).toBe(200);
  expect((await page.request.delete(`/api/lessons/${les.id}/items/${copyId}`, { headers: { Origin: 'http://127.0.0.1:4173' } })).status()).toBeLessThan(300);
  expect(await itemOf(page, les.id, copyId)).toBeUndefined();
  expect(await used()).toBe(u);

  // T07 shows the figure and warns from 80 %.
  const quota = (await storage(page)).quotaBytes as number;
  await setStorage(page, quota * 0.85);
  await page.goto(T07(cur.id, les.id));
  const bar = page.getByRole('toolbar', { name: 'Phần Bài học' });
  await expect(bar.getByText(/^Đã dùng 8,5 GB \/ 10 GB$/)).toBeVisible();
  await expect(bar.getByText('Workspace đã dùng 85% dung lượng lưu trữ.')).toBeVisible();
  await evidence(page, 'TC-027');
});
