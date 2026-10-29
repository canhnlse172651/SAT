import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, ok, uid } from './helpers';

test.setTimeout(300_000);

test('[002:NFR-3] TC-072 hiệu năng nhân bản Bài 60 mục và giáo trình 20 Bài (~400 mục)', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-072 ${uid()}`, 1);
  const big = await addLesson(page, c.id, 'Bài 60 mục');
  for (let i = 1; i <= 30; i++) await addItem(page, big.id, 'lesson', { title: `S${i}`, content: READY_STEP });
  for (let i = 1; i <= 30; i++) await addItem(page, big.id, 'exercise', { title: `E${i}`, content: READY_SET });
  let t = Date.now();
  const copy = await ok(page, 'POST', `/lessons/${big.id}/duplicate`);
  const lessonMs = Date.now() - t;
  expect(copy.items).toHaveLength(60);

  const c2 = await createCurriculum(page, `TC-072 lớn ${uid()}`, 1);
  for (let b = 1; b <= 20; b++) {
    const l = await addLesson(page, c2.id, `Bài ${b}`);
    for (let i = 1; i <= 10; i++) await addItem(page, l.id, 'lesson', { title: `S${i}`, content: READY_STEP });
    for (let i = 1; i <= 10; i++) await addItem(page, l.id, 'exercise', { title: `E${i}`, content: READY_SET });
  }
  t = Date.now();
  const dup = await ok(page, 'POST', `/curricula/${c2.id}/duplicate`, { name: `${c2.name} (bản sao)`, hsk: 1 });
  const curriculumMs = Date.now() - t;
  expect(dup.lessons).toHaveLength(20);
  test.info().annotations.push({
    type: 'NFR-3',
    description: `Nhân bản Bài 60 mục: ${lessonMs} ms · giáo trình 20 Bài / 400 mục: ${curriculumMs} ms`,
  });
  expect(lessonMs).toBeLessThanOrEqual(10_000);
  expect(curriculumMs).toBeLessThanOrEqual(30_000);
});
