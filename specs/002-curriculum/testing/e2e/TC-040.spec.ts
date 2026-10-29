import { test, expect } from '@playwright/test';
import {
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  getLesson,
  ok,
  otherPage,
  publishLesson,
  uid,
} from './helpers';

test('[002:AC-10.6] TC-040 thay đổi của GV hiện cho HV ở lần tải kế tiếp ≤ 5 s (NFR-4)', async ({ page, browser }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-040 ${uid()}`, 1);
  const l1 = await addLesson(page, c.id, 'Bài 1');
  const l2 = await addLesson(page, c.id, 'Bài 2');
  const s1 = await addItem(page, l1.id, 'lesson', { title: 'S1', content: READY_STEP });
  const s2 = await addItem(page, l2.id, 'lesson', { title: 'S2', content: READY_STEP });
  await publishLesson(page, l1.id, [s1]);
  await publishLesson(page, l2.id, [s2]);
  await devClass(page, c.id, 'Lớp TC-040', { studentEmails: ['hv1@sat.dev'] });
  const hv = await otherPage(browser, 'HV');

  const l1Now = await getLesson(page, l1.id);
  await ok(page, 'PATCH', `/lessons/${l1.id}`, { expectedVersion: l1Now.version, name: 'Bài 1 mới' });
  const item = (await getLesson(page, l1.id)).items[0];
  await ok(page, 'PUT', `/lessons/${l1.id}/items/${s1}`, {
    expectedVersion: item.version,
    title: 'S1',
    content: { blocks: [{ type: 'text', text: 'Nội dung mới 学习' }] },
  });
  await ok(page, 'PUT', `/curricula/${c.id}/lesson-order`, { expectedOrder: [l1.id, l2.id], order: [l2.id, l1.id] });
  const savedAt = Date.now();

  const seen = await hv.request.get(`/api/learn/curricula/${c.id}`).then((r) => r.json());
  expect(Date.now() - savedAt).toBeLessThanOrEqual(5000);
  expect(seen.lessons.map((l: { name: string }) => l.name)).toEqual(['Bài 2', 'Bài 1 mới']);
  expect(seen.lessons[1].sections.lesson[0].content.blocks[0].text).toBe('Nội dung mới 学习');
  await hv.context().close();
});
