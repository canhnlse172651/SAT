import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, gvPage } from './helpers';

test('[006:AC-2.8] TC-015 leaving T22 with unsaved changes asks first', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page);
  await page.goto(T22(d.id));
  await page.getByLabel('Tên bài thi').fill('Đổi tên chưa lưu');
  await page.getByRole('link', { name: 'Lớp học' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Bạn có thay đổi chưa lưu. Rời trang và bỏ thay đổi?');
  await evidence(page, 'TC-015', 1);
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(new RegExp(`${T22(d.id)}$`));
  await expect(page.getByLabel('Tên bài thi')).toHaveValue('Đổi tên chưa lưu');

  let kind = '';
  page.once('dialog', (dlg) => {
    kind = dlg.type();
    void dlg.dismiss();
  });
  await page.reload({ timeout: 3000 }).catch(() => undefined);
  expect(kind).toBe('beforeunload');

  await page.getByRole('link', { name: 'Lớp học' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Rời trang' }).click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc$/);
  await evidence(page, 'TC-015', 2);
});
