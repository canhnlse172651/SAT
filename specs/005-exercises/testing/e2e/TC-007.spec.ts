import { expect, test } from '@playwright/test';
import { T07, T18, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-1.6] TC-007 leaving T07 with an unsaved set asks first', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ A', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await setBlock(page, 1).getByLabel('Tiêu đề', { exact: true }).fill('Bộ A sửa');
  await page.getByRole('tab', { name: /^Bài học/ }).click();

  // 1. "Về Soạn bài" → the confirmation counts set A.
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Có 1 mục chưa lưu. Rời trang và bỏ các thay đổi này?');
  await evidence(page, 'TC-007', 1);
  // 2. "Ở lại" keeps everything.
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(new RegExp(`${T07(cur.id, les.id)}$`));
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ A sửa');

  // Reloading with the change → the browser's leave warning (dismissed: the page stays).
  let kind = '';
  page.once('dialog', (d) => {
    kind = d.type();
    void d.dismiss();
  });
  await page.reload({ timeout: 3000 }).catch(() => undefined);
  expect(kind).toBe('beforeunload');
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ A sửa');

  // 3. Again, "Rời đi": leaves T07 and drops the change.
  await page.getByRole('button', { name: 'Về Soạn bài' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Rời đi' }).click();
  await expect(page).toHaveURL(new RegExp(`${T18(cur.id, les.id)}$`));
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ A');
  await evidence(page, 'TC-007', 2);
});
