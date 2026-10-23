import { test, expect } from '@playwright/test';
import { READY_SET, addItem, addLesson, asGv, createCurriculum, devClass, learningData, ok, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-13.4] TC-016 lớp hoặc dữ liệu phát sinh sau khi hộp xóa đã mở', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-016 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  const e = await addItem(page, l.id, 'exercise', { title: 'E1', content: READY_SET });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  const openDelete = async () => {
    await page.getByRole('button', { name: 'Thao tác giáo trình' }).click();
    await page.getByRole('menuitem', { name: 'Xóa giáo trình' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Xóa giáo trình');
  };

  await openDelete();
  const cls = await devClass(page, c.id, 'Lớp mới');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa giáo trình' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể xóa: giáo trình đang được dùng bởi 1 lớp.');
  await shot(page, 'TC-016', 1);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đóng' }).click();

  await ok(page, 'DELETE', `/dev/curriculum/classes/${cls.id}`);
  await page.reload();
  await openDelete();
  await learningData(page, e);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa giáo trình' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'Không thể xóa: học viên đã có dữ liệu học tập trong giáo trình này. Bạn có thể lưu trữ giáo trình.',
  );
  await shot(page, 'TC-016', 2);
  expect((await page.request.get(`/api/curricula/${c.id}`)).status()).toBe(200);
});
