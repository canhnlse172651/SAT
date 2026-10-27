import { expect, test } from '@playwright/test';
import { addStep, api, fileBlock, freshGvPage, newCurriculum, newLesson, png, saveStep, setStorage, upload } from './helpers';

test('[004:AC-5.5] [004:AC-18.1] TC-038 YouTube videos do not count; a file used twice counts once', async ({ browser }) => {
  const { page } = await freshGvPage(browser); // own workspace: storage is per workspace
  await setStorage(page, 0);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  const used = async () => (await api<{ usedBytes: number }>(page, 'GET', '/api/steps/storage')).usedBytes;
  const before = await used();
  await saveStep(page, les.id, id, 'YouTube', {
    goal: '',
    blocks: [{ id: 'v', type: 'video', file: null, youtube: 'dQw4w9WgXcQ', caption: '' }],
  });
  expect(await used()).toBe(before);

  const img = await upload(page, 'image', 'anh.png', png());
  expect(img.status).toBe(201);
  await saveStep(page, les.id, id, 'YouTube', {
    goal: '',
    blocks: [{ id: 'v', type: 'video', file: null, youtube: 'dQw4w9WgXcQ', caption: '' }, fileBlock('image', img.body)],
  });
  const withImage = await used();
  expect(withImage).toBe(before + img.body.size);
  // Duplicating the Bài (002) uses the same file a second time.
  await api(page, 'POST', `/api/lessons/${les.id}/duplicate`);
  expect(await used()).toBe(withImage);
});
