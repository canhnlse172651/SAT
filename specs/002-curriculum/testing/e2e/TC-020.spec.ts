import { test, expect } from '@playwright/test';
import { addLesson, asGv, call, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });
test.setTimeout(120_000);

test('[002:AC-5.5] TC-020 giới hạn 100 bài', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-020 ${uid()}`, 1);
  let first = '';
  for (let i = 1; i <= 100; i++) {
    const l = await addLesson(page, c.id, `Bài ${i}`);
    if (i === 1) first = l.id;
  }
  await page.goto(`/gv/giao-trinh/${c.id}`);
  const add = page.getByRole('button', { name: 'Thêm bài' });
  await expect(add).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText('Mỗi giáo trình tối đa 100 bài', { exact: true })).toBeVisible();
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  await expect(page.getByRole('menuitem', { name: 'Nhân bản bài' })).toHaveAttribute('aria-disabled', 'true');
  await shot(page, 'TC-020', 1);

  const extra = await call(page, 'POST', `/curricula/${c.id}/lessons`, { name: 'Bài 101' });
  expect(extra.status).toBe(409);
  expect(extra.body.error.message).toBe('Mỗi giáo trình tối đa 100 bài');
  const dup = await call(page, 'POST', `/lessons/${first}/duplicate`);
  expect(dup.status).toBe(409);
  expect(dup.body.error.message).toBe('Mỗi giáo trình tối đa 100 bài');
  const detail = await call(page, 'GET', `/curricula/${c.id}`);
  expect(detail.body.lessons).toHaveLength(100);
});
