import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  deck,
  evidence,
  fileBlock,
  gvPage,
  newCurriculum,
  newLesson,
  padded,
  saveStep,
  text,
  upload,
  vocab,
} from './helpers';

test('[004:AC-7.1] TC-048 a complete draft step is published', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const video = await upload(page, 'video', 'bai.webm', padded('webm', 1 * MB));
  expect(video.status).toBe(201);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Đầy đủ', {
    goal: '',
    blocks: [
      text('<p>你好</p>'),
      vocab([{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' }]),
      { id: 'g', type: 'grammar', name: 'Câu hỏi với 吗', examples: [{ sentence: '你好吗？' }] },
      { id: 'd', type: 'dialogue', lines: [{ hanzi: '你好' }] },
      fileBlock('video', video.body),
      deck([{ id: 'c1', front: '你', meaning: 'bạn' }]),
    ],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(step.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
  await expect(step.getByRole('button', { name: 'Lưu nháp' })).toHaveCount(0);
  await evidence(page, 'TC-048');
});
