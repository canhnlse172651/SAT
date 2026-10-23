import { test, expect } from '@playwright/test';
import { addLesson, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-5.3] [002:AC-5.4] TC-019 đổi tên bài trên T06 và T18 (NFR-8)', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-019 ${uid()}`, 1);
  await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');
  await page.goto(`/gv/giao-trinh/${c.id}`);

  await lessonRow(page, 'Bài 1').getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  await page.getByRole('menuitem', { name: 'Đổi tên' }).click();
  const dlg = page.getByRole('dialog', { name: 'Đổi tên bài' });
  await dlg.getByLabel('Tên bài').fill('');
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(dlg.getByText('Vui lòng nhập tên bài', { exact: true })).toBeVisible();
  await dlg.getByLabel('Tên bài').fill('b'.repeat(101));
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(dlg.getByText('Tên bài tối đa 100 ký tự', { exact: true })).toBeVisible();
  await dlg.getByLabel('Tên bài').fill('Bài 1 – 你好 nǐ hǎo');
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã đổi tên bài', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1 – 你好 nǐ hǎo', 'Bài 2']);
  await expect(lessonRow(page, 'Bài 1 – 你好 nǐ hǎo').getByText('Nháp', { exact: true })).toBeVisible();
  await shot(page, 'TC-019', 1);

  await page.getByRole('link', { name: 'Bài 1 – 你好 nǐ hǎo' }).click();
  await expect(page).toHaveURL(/\/bai\/[0-9a-f]{24}$/);
  await page.getByRole('button', { name: 'Thao tác với bài', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Đổi tên' }).click();
  await page.getByRole('dialog', { name: 'Đổi tên bài' }).getByLabel('Tên bài').fill('Bài 1 – 你好 (sửa)');
  await page.getByRole('dialog', { name: 'Đổi tên bài' }).getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã đổi tên bài', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bài 1 – 你好 (sửa)');
  await page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: c.name }).click();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1 – 你好 (sửa)', 'Bài 2']);
});
