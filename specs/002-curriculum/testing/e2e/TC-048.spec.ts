import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, call, createCurriculum, getLesson, learningData, ok, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-19.5] TC-048 phần đổi sau khi mở hộp duyệt thì không thay thế', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-048 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const e1 = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  await addItem(page, l.id, 'exercise', { title: 'E2', content: READY_SET });
  const items = [{ title: 'AI 1', content: READY_SET }];

  const p1 = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l.id, section: 'exercise', items });
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  await page.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 3' })).toBeVisible();

  const r1 = await call(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: l.id, section: 'exercise', items, token: p1.token });
  expect(r1.status).toBe(409);
  expect(r1.body.error.code).toBe('SECTION_CHANGED');
  expect(r1.body.error.message).toBe('Nội dung của phần đã thay đổi. Vui lòng kiểm tra lại.');
  expect(r1.body.error.details.deleted).toEqual(['E1', 'E2', '']);
  expect((await getLesson(page, l.id)).items).toHaveLength(3);

  const p2 = await ok(page, 'POST', '/dev/curriculum/ai-approve/preview', { lessonId: l.id, section: 'exercise', items });
  await learningData(page, e1);
  const r2 = await call(page, 'POST', '/dev/curriculum/ai-approve', { lessonId: l.id, section: 'exercise', items, token: p2.token });
  expect(r2.status).toBe(409);
  expect(r2.body.error.message).toBe('Nội dung của phần đã thay đổi. Vui lòng kiểm tra lại.');
  expect(r2.body.error.details.archived).toEqual(['E1']);
  expect((await getLesson(page, l.id)).items.map((i: { title: string }) => i.title)).toEqual(['E1', 'E2', '']);
});
