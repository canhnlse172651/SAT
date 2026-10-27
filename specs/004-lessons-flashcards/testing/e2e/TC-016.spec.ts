import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-2.3] TC-016 another step saved elsewhere does not block', async ({ browser }) => {
  const { ctx, page: tab1 } = await gvPage(browser);
  const cur = await newCurriculum(tab1);
  const les = await newLesson(tab1, cur.id);
  await addStep(tab1, les.id);
  await addStep(tab1, les.id);
  const tab2 = await ctx.newPage();
  await tab1.goto(T07(cur.id, les.id));
  await tab2.goto(T07(cur.id, les.id));
  const a = tab1.getByRole('region', { name: 'Bước học 1' });
  await a.getByLabel('Tên bước học').fill('Một');
  await a.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(a.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  const b = tab2.getByRole('region', { name: 'Bước học 2' });
  await b.getByLabel('Tên bước học').fill('Hai');
  await b.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(b.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await expect(tab2.getByText(/Nội dung đã được thay đổi ở nơi khác/)).toHaveCount(0);
  await evidence(tab2, 'TC-016');
});
