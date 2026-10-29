import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, call, createCurriculum, getLesson, uid } from './helpers';

test('[002:AC-19.4] TC-047 mục chưa đạt điều kiện xuất bản thì không duyệt', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-047 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'Cũ', content: READY_STEP });
  const items = [
    { title: 'Bước AI 1', content: READY_STEP },
    { title: 'Bước AI 2', content: { blocks: [{ type: 'text', text: '' }] } },
  ];
  const r = await call(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: l.id, section: 'lesson', items, token: 'x' });
  expect(r.status).toBe(422);
  expect(r.body.error.message).toMatch(/^Không thể duyệt:/);
  expect(r.body.error.message).toContain('Bước AI 2');
  expect(r.body.error.message).toContain('Khối 1 (Văn bản) đang trống');
  expect((await getLesson(page, l.id)).items.map((i: { title: string }) => i.title)).toEqual(['Cũ']);
});
