import { test, expect } from '@playwright/test';
import { READY_SET, READY_STEP, addItem, addLesson, asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-7.2] [002:AC-8.2] TC-077 không có thao tác chuyển mục hay sửa phần trong T07', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-077 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson', { title: 'S1', content: READY_STEP, publish: true });
  await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET, publish: true });
  const forbidden = /chuyển sang|di chuyển sang|sang phần|sang bài|sang giáo trình|thêm phần|xóa phần|đổi tên phần|sắp xếp phần/i;

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}/bai-hoc`);
  for (const tab of ['Bài học', 'Bài tập']) {
    await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
    const names = await page.getByRole('button').allInnerTexts();
    const menuItems = await page.getByRole('menuitem').allInnerTexts();
    for (const n of [...names, ...menuItems]) expect(n, `${tab}: ${n}`).not.toMatch(forbidden);
  }
  expect(await page.getByRole('tab').count()).toBe(2);
  await shot(page, 'TC-077', 1);
});
