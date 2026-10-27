import { expect, test } from '@playwright/test';
import { addStep, api, getLesson, gvPage, newCurriculum, newLesson, vocab } from './helpers';

test('[004:AC-2.8] TC-019 the API refuses an invalid value', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  const res = await api(
    page,
    'PUT',
    `/api/lessons/${les.id}/items/${id}`,
    { expectedVersion: 1, title: 'X', content: { goal: '', blocks: [vocab([{ hanzi: 'abc', meaning: 'x' }])] } },
    422,
  );
  expect(res.error.message).toBe('Chưa lưu được: Từ phải có chữ Hán');
  const after = await getLesson(page, les.id);
  const item = after.items.find((i: { id: string }) => i.id === id);
  expect(item.version).toBe(1);
  expect(item.title).toBe('');
});
