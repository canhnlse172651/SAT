import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, getLesson, ok, uid } from './helpers';

test('[002:AC-14.1] [002:AC-14.4] TC-058 tên bản sao tối đa 100 ký tự, bản sao độc lập', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-058 ${uid()}`, 1);
  const name = 'A'.repeat(100);
  const l = await addLesson(page, c.id, name);
  await addItem(page, l.id, 'lesson', { title: 'S1', content: READY_STEP });
  const original = await getLesson(page, l.id);

  const copy = await ok(page, 'POST', `/lessons/${l.id}/duplicate`);
  // Original part shortened so the whole is 100 characters: 90 × A + ' (bản sao)' (10 characters).
  expect(copy.name).toHaveLength(100);
  expect(copy.name).toBe('A'.repeat(100 - ' (bản sao)'.length) + ' (bản sao)');

  const item = copy.items[0];
  await ok(page, 'POST', `/lessons/${copy.id}/items/${item.id}/publish`, {
    expectedVersion: item.version,
    title: 'S1 bản sao',
    content: { blocks: [{ type: 'text', text: 'khác' }] },
  });
  await ok(page, 'POST', `/lessons/${copy.id}/items`, { section: 'exercise' });
  const fresh = await getLesson(page, copy.id);
  await ok(page, 'DELETE', `/lessons/${copy.id}/items/${fresh.items[1].id}`);

  const after = await getLesson(page, l.id);
  expect(after.items).toEqual(original.items);
  expect(after.name).toBe(name);
});
