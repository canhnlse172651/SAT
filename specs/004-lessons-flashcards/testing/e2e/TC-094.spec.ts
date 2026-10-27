import { expect, test } from '@playwright/test';
import { api, gvPage, newCurriculum, newLesson, text } from './helpers';

test('[004:AC-19.2] [004:AC-19.3] TC-094 confirmation for an empty Bài học section of a draft Bài', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id, 'Bài 5');
  const preview = await api(page, 'POST', '/api/dev/curriculum/ai-approve/preview', {
    lessonId: les.id,
    section: 'lesson',
    items: ['Một', 'Hai'].map((title) => ({ title, content: { goal: '', blocks: [text('<p>新</p>')] } })),
  });
  expect(preview.confirm.title).toBe('Lưu 2 bước học vào phần Bài học của “Bài 5”?');
  expect(preview.confirm.lines).toEqual([
    'Bài chưa xuất bản — học viên sẽ thấy các bước mới khi Bài được xuất bản.',
  ]);
});
