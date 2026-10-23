import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, call, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });
test.setTimeout(120_000);

test('[002:AC-7.9] TC-029 tối đa 30 bộ bài tập không lưu trữ, nút thêm luôn bật', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-029 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  for (let i = 1; i <= 2; i++) {
    await addItem(page, l.id, 'exercise', { title: `Lưu trữ ${i}`, content: READY_SET, archive: true });
  }
  for (let i = 1; i <= 28; i++) await addItem(page, l.id, 'exercise');

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/thu-cong`);
  const add = page.getByRole('button', { name: 'Thêm bộ bài tập' });
  await add.click();
  await expect(page.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 31' })).toBeVisible();
  await add.click();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 32' })).toBeVisible();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByText('Mỗi bài có tối đa 30 bộ bài tập.', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bộ bài tập 33' })).toHaveCount(0);
  await expect(add).toBeEnabled();
  await shot(page, 'TC-029', 1);

  const r = await call(page, 'POST', `/lessons/${l.id}/items`, { section: 'exercise' });
  expect(r.status).toBe(409);
  expect(r.body.error.message).toBe('Mỗi bài có tối đa 30 bộ bài tập.');
});
