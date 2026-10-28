import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, gvPage, mcqs } from './helpers';

test('[006:AC-2.6] TC-013 no 101st question: "Bài thi có tối đa 100 câu hỏi"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page, { content: mcqs(100) });
  await page.goto(T22(d.id));
  await expect(page.getByRole('region', { name: 'Câu 100' })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Trắc nghiệm', exact: true }).click();
  await expect(page.getByText('Bài thi có tối đa 100 câu hỏi')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Câu 101' })).toHaveCount(0);
  await evidence(page, 'TC-013');
});
