import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, review, set } from './helpers';

test('[005:AC-15.2] TC-077 nothing answered, nothing submitted', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ trống', content: set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]) }]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await expect(page.getByText('Bạn cần trả lời ít nhất 1 câu trước khi nộp bài')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await evidence(page, 'TC-077');
  expect((await review(page, d.cls, d.sets[0]!)).body.submitted).toBe(false);
});
