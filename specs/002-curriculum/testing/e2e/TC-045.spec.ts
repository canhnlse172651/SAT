import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, call, createCurriculum, getLesson, ok, uid } from './helpers';

test('[002:AC-11.6] TC-045 duyệt quá 30 mục thì không thay đổi gì', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-045 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'Cũ 1', content: READY_STEP });
  await addItem(page, l.id, 'lesson', { title: 'Cũ 2', content: READY_STEP });
  const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `AI ${i + 1}`, content: READY_STEP }));

  const p31 = await call(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l.id, section: 'lesson', items: mk(31) });
  expect(p31.status).toBe(422);
  const r31 = await call(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: l.id, section: 'lesson', items: mk(31), token: 'x' });
  expect(r31.status).toBe(422);
  expect(r31.body.error.message).toBe('Mỗi bài có tối đa 30 bước học. Hãy xóa bớt mục trong review rồi duyệt lại.');
  expect((await getLesson(page, l.id)).items.map((i: { title: string }) => i.title)).toEqual(['Cũ 1', 'Cũ 2']);

  const p30 = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l.id, section: 'lesson', items: mk(30) });
  await ok(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: l.id, section: 'lesson', items: mk(30), token: p30.token });
  const after = await getLesson(page, l.id);
  expect(after.items).toHaveLength(30);
  expect(after.items[0].title).toBe('AI 1');
  expect(after.items.some((i: { title: string }) => i.title.startsWith('Cũ'))).toBe(false);
});
