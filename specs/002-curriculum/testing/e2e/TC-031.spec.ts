import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, call, createCurriculum, getLesson, uid } from './helpers';

test('[002:AC-8.2] TC-031 không chuyển hay thêm mục sang phần kia', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-031 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const l1 = await addItem(page, l.id, 'lesson', { title: 'L1', content: READY_STEP });
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });

  const move = await call(page, 'POST', `/lessons/${l.id}/items/${e1}/move`, {
    direction: 'up',
    expectedOrder: [l1],
  });
  expect(move.status).toBe(409);
  const add = await call(page, 'POST', `/lessons/${l.id}/items`, { section: 'lesson', afterItemId: e1 });
  expect(add.status).toBe(409);

  const after = await getLesson(page, l.id);
  const of = (s: string) => after.items.filter((i: { section: string }) => i.section === s).map((i: { id: string }) => i.id);
  expect(of('lesson')).toEqual([l1]);
  expect(of('exercise')).toEqual([e1]);
});
