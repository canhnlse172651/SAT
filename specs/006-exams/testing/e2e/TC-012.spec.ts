import { expect, test } from '@playwright/test';
import { T22, draftExam, e3, evidence, gvPage } from './helpers';

test('[006:AC-2.5] TC-012 question count and total points always shown, updated at once', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page, { content: e3() });
  await page.goto(T22(d.id));
  const sum = page.locator('.xm-sum');
  await expect(sum).toHaveText(/3\s*câu hỏi\s*4\s*tổng điểm tối đa/);
  await page.getByRole('region', { name: 'Câu 1' }).getByLabel('Điểm').fill('2');
  await expect(sum).toHaveText(/3\s*câu hỏi\s*5\s*tổng điểm tối đa/);
  await page.getByRole('region', { name: 'Câu 3' }).getByRole('button', { name: 'Xóa câu' }).click();
  await expect(sum).toHaveText(/2\s*câu hỏi\s*4\s*tổng điểm tối đa/);
  await evidence(page, 'TC-012');
});
