import { test, expect } from '@playwright/test';
import {
  READY_SET,
  READY_STEP,
  addItem,
  addLesson,
  asGv,
  createCurriculum,
  devClass,
  lessonRow,
  publishLesson,
  shot,
  uid,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-12.4] TC-051 xóa bài không có dữ liệu học tập', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-051 ${uid()}`, 1);
  await addLesson(page, c.id, 'Bài 1');
  const b2 = await addLesson(page, c.id, 'Bài 2');
  await addLesson(page, c.id, 'Bài 3');
  const ids = [
    await addItem(page, b2.id, 'lesson', { title: 'S1', content: READY_STEP }),
    await addItem(page, b2.id, 'lesson', { title: 'S2', content: READY_STEP }),
    await addItem(page, b2.id, 'exercise', { title: 'E1', content: READY_SET }),
  ];
  await publishLesson(page, b2.id, ids);
  await devClass(page, c.id, 'Lớp TC-051');

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài 2').getByRole('button', { name: 'Thao tác với Bài 2' }).click();
  await page.getByRole('menuitem', { name: 'Xóa bài' }).click();
  const dlg = page.getByRole('alertdialog');
  await expect(dlg).toContainText('Bài 2');
  await expect(dlg).toContainText('Sẽ xóa 2 bước học, 1 bộ bài tập.');
  await expect(dlg).toContainText('Bài đang hiển thị với học viên của 1 lớp.');
  await shot(page, 'TC-051', 1);
  await dlg.getByRole('button', { name: 'Xóa bài' }).click();
  await expect(page.getByText('Đã xóa bài', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/gv/giao-trinh/${c.id}$`));
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1', 'Bài 3']);
  await expect(page.locator('.cur-row__ord')).toHaveText(['1', '2']);
});
