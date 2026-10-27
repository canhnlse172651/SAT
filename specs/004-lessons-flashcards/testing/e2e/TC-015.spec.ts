import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, getLesson, gvPage, newCurriculum, newLesson, saveStep, text } from './helpers';

test('[004:AC-2.3] TC-015 a step saved elsewhere: reload or overwrite', async ({ browser }) => {
  const { ctx, page: tab1 } = await gvPage(browser);
  const cur = await newCurriculum(tab1);
  const les = await newLesson(tab1, cur.id);
  const id = await addStep(tab1, les.id);
  const other = await addStep(tab1, les.id);
  await saveStep(tab1, les.id, id, 'Gốc', { goal: '', blocks: [text('<p>文</p>')] });
  const tab2 = await ctx.newPage();
  await tab1.goto(T07(cur.id, les.id));
  await tab2.goto(T07(cur.id, les.id));

  await tab1.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học').fill('Tab 1');
  await tab1.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(tab1.getByRole('region', { name: 'Bước học 1' }).getByText('Chưa lưu', { exact: true })).toHaveCount(0);

  await tab2.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên bước học').fill('Khác (tab 2)');
  const s2 = tab2.getByRole('region', { name: 'Bước học 1' });
  await s2.getByLabel('Mục tiêu bước học').fill('Mục tiêu tab 2');
  await s2.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(s2.getByText(/^Nội dung đã được thay đổi ở nơi khác lúc \d\d:\d\d\.$/)).toBeVisible();
  await expect(s2.getByRole('button', { name: 'Ghi đè bằng bản của tôi' })).toBeVisible();
  await evidence(tab2, 'TC-015', 1);
  await s2.getByRole('button', { name: 'Tải lại bản mới nhất' }).click();
  await expect(s2.getByLabel('Tên bước học')).toHaveValue('Tab 1');
  await expect(s2.getByLabel('Mục tiêu bước học')).toHaveValue('');
  await expect(tab2.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên bước học')).toHaveValue('Khác (tab 2)');

  // Again, and overwrite this time.
  await tab1.getByRole('region', { name: 'Bước học 1' }).getByLabel('Tên bước học').fill('Tab 1 lần 2');
  await tab1.getByRole('region', { name: 'Bước học 1' }).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(tab1.getByRole('region', { name: 'Bước học 1' }).getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await s2.getByLabel('Tên bước học').fill('Bản của tab 2');
  await s2.getByRole('button', { name: 'Lưu nháp' }).click();
  await s2.getByRole('button', { name: 'Ghi đè bằng bản của tôi' }).click();
  await expect(s2.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  const saved = await getLesson(tab1, les.id);
  expect(saved.items.find((i: { id: string }) => i.id === id).title).toBe('Bản của tab 2');
  expect(saved.items.find((i: { id: string }) => i.id === other).title).toBe('');
  await evidence(tab2, 'TC-015', 2);
});
