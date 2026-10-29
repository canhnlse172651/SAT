import { test, expect } from '@playwright/test';
import { addLesson, asGv, createCurriculum, lessonRow, ok, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-14.5] [002:AC-15.5] TC-059 nhân bản thất bại không để lại bản sao', async ({ page }) => {
  const msg = 'Nhân bản không thành công. Vui lòng thử lại.';
  const name = `TC-059 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 1);
  await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');

  await ok(page, 'POST', '/dev/curriculum/faults', { op: 'duplicate-lesson', fail: true });
  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  await page.getByRole('menuitem', { name: 'Nhân bản bài' }).click();
  await expect(page.getByText(msg, { exact: true })).toBeVisible();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1', 'Bài 2']);
  await shot(page, 'TC-059', 1);
  await page.reload();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1', 'Bài 2']);

  await ok(page, 'POST', '/dev/curriculum/faults', { op: 'duplicate-curriculum', fail: true });
  await page.getByRole('button', { name: 'Nhân bản', exact: true }).click();
  const dlg = page.getByRole('dialog', { name: 'Nhân bản giáo trình' });
  await expect(dlg.getByLabel('Tên')).toHaveValue(`${name} (bản sao)`);
  await dlg.getByRole('button', { name: 'Nhân bản' }).click();
  await expect(page.getByText(msg, { exact: true }).first()).toBeVisible();
  await shot(page, 'TC-059', 2);
  await page.goto('/gv/giao-trinh');
  await page.getByLabel('Tìm giáo trình').fill(`${name} (bản sao`);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy giáo trình phù hợp' })).toBeVisible();
  await page.reload();
  await page.getByLabel('Tìm giáo trình').fill(`${name} (bản sao`);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy giáo trình phù hợp' })).toBeVisible();
});
