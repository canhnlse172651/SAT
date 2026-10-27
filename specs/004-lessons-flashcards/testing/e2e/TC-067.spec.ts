import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-11.1] [004:AC-11.9] TC-067 a new deck block and the T08 dialog over T07', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await addStep(page, les.id);
  await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  const s2 = page.getByRole('region', { name: 'Bước học 2' });
  await s1.getByLabel('Tên bước học').fill('Từ mới');
  await s2.getByLabel('Tên bước học').fill('Bước khác');
  await s1.getByRole('button', { name: 'Thêm khối' }).click();
  await s1.getByRole('group', { name: 'Chọn loại khối' }).getByRole('button', { name: 'Bộ thẻ từ vựng' }).click();
  const block = s1.locator('.st-block').nth(1);
  await expect(block.getByText('Khối 2 · Bộ thẻ từ vựng')).toBeVisible();
  await expect(block).toContainText('Bộ thẻ mới · 1 thẻ');
  await expect(block.getByRole('button', { name: 'Soạn bộ thẻ' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(s1.getByText('Chưa lưu', { exact: true })).toBeVisible();
  const scroll = await page.evaluate(() => window.scrollY);

  await block.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog', { name: 'Bộ thẻ · Từ mới' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${les.id}/bai-hoc$`));
  await expect(dialog.getByLabel('Tên bộ thẻ')).toHaveValue('Bộ thẻ mới');
  await expect(
    dialog.getByText('1 thẻ · lật thẻ: chữ Hán → pinyin, nghĩa · lưu cùng bước học (“Lưu nháp” / “Lưu thay đổi”)'),
  ).toBeVisible();
  await expect(dialog.getByText('Thẻ 1', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Thêm thẻ' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Xong' })).toBeVisible();
  // AC-11.1: "Xong" is the only way to close the dialog.
  await expect(dialog.getByRole('button', { name: 'Đóng' })).toHaveCount(0);
  await evidence(page, 'TC-067', 1);
  await dialog.getByRole('button', { name: 'Xong' }).click();
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  await expect(s1.getByLabel('Tên bước học')).toHaveValue('Từ mới');
  await expect(s2.getByLabel('Tên bước học')).toHaveValue('Bước khác');
  await expect(page.getByRole('tab', { name: /Bài học/ })).toHaveAttribute('aria-selected', 'true');
  await evidence(page, 'TC-067', 2);
});
