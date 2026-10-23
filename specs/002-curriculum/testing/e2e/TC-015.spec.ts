import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, createCurriculum, learningData, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-13.3] TC-015 giáo trình có dữ liệu học tập không xóa được', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-015 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const e = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });
  await learningData(page, e);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await page.getByRole('button', { name: 'Thao tác giáo trình' }).click();
  await page.getByRole('menuitem', { name: 'Xóa giáo trình' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa giáo trình' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'Không thể xóa: học viên đã có dữ liệu học tập trong giáo trình này. Bạn có thể lưu trữ giáo trình.',
  );
  await shot(page, 'TC-015', 1);
  expect((await page.request.get(`/api/curricula/${c.id}`)).status()).toBe(200);
});
