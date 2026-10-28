import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, getExam, gvPage, uid } from './helpers';

test('[006:AC-2.7] TC-014 a save over a newer one from another tab is refused, the text kept', async ({ browser }) => {
  const { ctx, page } = await gvPage(browser);
  const d = await draftExam(page);
  const tab2 = await ctx.newPage();
  await page.goto(T22(d.id));
  await tab2.goto(T22(d.id));
  const t = uid();
  await page.getByLabel('Tên bài thi').fill(`Tên thẻ 1 ${t}`);
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/^Đã lưu lúc/)).toBeVisible();
  await tab2.getByLabel('Hướng dẫn (tùy chọn)').fill('Hướng dẫn thẻ 2');
  await tab2.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(tab2.getByText('Bài thi đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất.')).toBeVisible();
  await expect(tab2.getByLabel('Hướng dẫn (tùy chọn)')).toHaveValue('Hướng dẫn thẻ 2');
  const e = await getExam(page, d.id);
  expect(e.name).toBe(`Tên thẻ 1 ${t}`);
  expect(e.content.instructions).toBe('');
  await evidence(tab2, 'TC-014');
});
