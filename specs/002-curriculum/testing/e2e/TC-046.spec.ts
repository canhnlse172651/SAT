import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  learningData,
  ok,
  publishLesson,
  uid,
} from './helpers';

test('[002:AC-19.1] TC-046 nội dung hộp xác nhận duyệt AI', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-046 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const s = await addItem(page, l.id, 'lesson', { title: 'S', content: READY_STEP });
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  await publishLesson(page, l.id, [s, e1]);
  await addItem(page, l.id, 'exercise', { title: 'E2', content: READY_SET });
  await addItem(page, l.id, 'exercise', { title: 'E3', content: READY_SET, archive: true });
  await learningData(page, e1);
  await devClass(page, c.id, 'Lớp 1');
  await devClass(page, c.id, 'Lớp 2');

  const items = ['AI 1', 'AI 2', 'AI 3', 'AI 4'].map((title) => ({ title, content: READY_SET }));
  const p = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l.id, section: 'exercise', items });
  expect(p.newCount).toBe(4);
  expect(p.deleted).toEqual(['E2', 'E3']);
  expect(p.archived).toEqual(['E1']);
  expect(p.note).toBe('Bài làm và điểm của học viên được giữ lại.');
  expect(p.warning).toBe('Nội dung mới sẽ hiển thị ngay với học viên của 2 lớp (trừ các phần đang ẩn ở từng lớp).');
  // Preview changes nothing.
  const still = await ok(page, 'GET', `/lessons/${l.id}`);
  expect(still.items.filter((i: { section: string }) => i.section === 'exercise')).toHaveLength(3);

  const l2 = await addLesson(page, c.id, 'Bài 2');
  const p2 = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l2.id, section: 'exercise', items });
  expect(p2.newCount).toBe(4);
  expect(p2.deleted).toEqual([]);
  expect(p2.archived).toEqual([]);
  expect(p2.note).toBeNull();
});
