import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, createCurriculum, learningData, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-12.5] [002:AC-12.6] TC-052 bài có dữ liệu học tập không xóa được', async ({ page }) => {
  const msg =
    'Không thể xóa bài vì học viên đã có dữ liệu học tập. Bạn có thể lưu trữ từng bước học, bộ bài tập, hoặc ẩn từng phần của bài ở từng lớp (Chi tiết lớp → Nội dung).';
  await asGv(page);
  const c = await createCurriculum(page, `TC-052 ${uid()}`, 1);
  const a = await addLesson(page, c.id, 'Bài A');
  const b = await addLesson(page, c.id, 'Bài B');
  const ea = await addItem(page, a.id, 'exercise', { title: 'EA', content: READY_SET });
  const eb = await addItem(page, b.id, 'exercise', { title: 'EB', content: READY_SET });
  await learningData(page, ea);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${a.id}`);
  await page.getByRole('button', { name: 'Thao tác với bài', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Xóa bài' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(msg);
  await shot(page, 'TC-052', 1);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đã hiểu' }).click();

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài B').getByRole('button', { name: 'Thao tác với Bài B' }).click();
  await page.getByRole('menuitem', { name: 'Xóa bài' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Xóa bài “Bài B”?');
  await learningData(page, eb);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa bài' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(msg);
  await shot(page, 'TC-052', 2);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đã hiểu' }).click();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài A', 'Bài B']);
});
