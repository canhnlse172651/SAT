import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, evidence, gvPage, hvPage, mcq, review, set } from './helpers';

test('[005:AC-15.4] TC-079 submitting without a connection', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ nộp', content: set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]) }]);
  const setId = d.sets[0]!;
  const { page, ctx } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Đã lưu$/ })).toBeVisible();

  // 1. Offline, submit and confirm.
  await ctx.setOffline(true);
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page.getByText('Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /^A\s*Đúng/ })).toBeChecked();
  await evidence(page, 'TC-079', 1);
  // 2. Online, "Thử lại".
  await ctx.setOffline(false);
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  expect((await review(page, d.cls, setId)).body.submitted).toBe(true);
  await evidence(page, 'TC-079', 2);
});
