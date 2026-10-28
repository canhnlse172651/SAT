import { expect, test } from '@playwright/test';
import { S07, S08, T10, T22, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-6.1] TC-040 deleting an exam without attempts', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-040 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], openIn: 24 * 60 });
  await page.goto(T22(ex.id));
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(`Xóa bài thi «${name}»? Thao tác không hoàn tác được.`);
  await dialog.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${T10}$`));
  await expect(page.getByText('Đã xóa bài thi')).toBeVisible();
  await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
  await evidence(page, 'TC-040', 1);

  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await expect(hv.page.getByRole('heading', { name: 'Chưa có bài thi nào.' })).toBeVisible();
  await hv.page.goto(S08(ex.id));
  await expect(hv.page.getByText('Không tìm thấy nội dung')).toBeVisible();
  await evidence(hv.page, 'TC-040', 2);
});
