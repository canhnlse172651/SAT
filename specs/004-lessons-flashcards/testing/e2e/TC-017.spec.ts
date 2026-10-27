import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-2.4] TC-017 a save that fails keeps the edits and offers "Thử lại"', async ({ browser }) => {
  const { ctx, page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await addStep(page, les.id);
  await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  const s2 = page.getByRole('region', { name: 'Bước học 2' });
  await s1.getByLabel('Tên bước học').fill('Mất mạng');
  await s2.getByLabel('Tên bước học').fill('Bước khác');
  await ctx.setOffline(true);
  await s1.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(s1.getByText('Chưa lưu được. Kiểm tra kết nối và thử lại.')).toBeVisible();
  await expect(s1.getByLabel('Tên bước học')).toHaveValue('Mất mạng');
  await expect(s2.getByLabel('Tên bước học')).toHaveValue('Bước khác');
  await evidence(page, 'TC-017', 1);
  await ctx.setOffline(false);
  await s1.getByRole('button', { name: 'Thử lại' }).click();
  await expect(s1.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await expect(s1.getByText('Chưa lưu được. Kiểm tra kết nối và thử lại.')).toHaveCount(0);
  await evidence(page, 'TC-017', 2);
});
