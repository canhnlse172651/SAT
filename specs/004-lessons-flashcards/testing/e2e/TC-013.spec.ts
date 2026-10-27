import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-2.2] TC-013 leaving T07 with unsaved edits asks first', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học').fill('Sẽ bị bỏ');
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Có 1 mục chưa lưu. Rời trang và bỏ các thay đổi này?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Các thay đổi chưa lưu sẽ bị bỏ; nội dung đã lưu không đổi.')).toBeVisible();
  await evidence(page, 'TC-013', 1);
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(new RegExp(`${les.id}/bai-hoc$`));
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học')).toHaveValue('Sẽ bị bỏ');
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await page.getByRole('button', { name: 'Rời đi' }).click();
  await expect(page).toHaveURL(new RegExp(`/bai/${les.id}$`));
  await page.goto(T07(cur.id, les.id));
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học')).toHaveValue('');
  await evidence(page, 'TC-013', 2);
});
