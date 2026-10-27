import { expect, test } from '@playwright/test';
import { T07, evidence, gvPage, newCurriculum, newLesson, publishedStep, text } from './helpers';

test('[004:AC-1.5] TC-009 moving keeps the unsaved edits of the step', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Một', [text('<p>一</p>')]);
  await publishedStep(page, les.id, 'Hai', [text('<p>二</p>')]);
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên bước học').fill('Hai (đang sửa)');
  await page.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Lên trên' }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 1/2 · Đã lưu').first()).toBeVisible();
  const first = page.getByRole('region', { name: 'Bước học 1' });
  await expect(first.getByLabel('Tên bước học')).toHaveValue('Hai (đang sửa)');
  await expect(first.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-009');
});
