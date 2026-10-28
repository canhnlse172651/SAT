import { expect, test } from '@playwright/test';
import { S07, evidence, freshStudents, gvPage, hvPage, newClass } from './helpers';

test('[006:AC-7.7] TC-053 no exam: "Chưa có bài thi nào."', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  await newClass(page, [h!]);
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await expect(hv.page.getByRole('heading', { name: 'Chưa có bài thi nào.' })).toBeVisible();
  await evidence(hv.page, 'TC-053');
});
