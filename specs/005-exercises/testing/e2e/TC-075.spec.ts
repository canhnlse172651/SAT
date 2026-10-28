import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, evidence, gvPage, hvPage, mcq, review, set } from './helpers';

const DONE = 'Bài đã nộp — mỗi bộ bài tập chỉ làm một lần';

test('[005:AC-14.9] [005:AC-17.7] TC-075 submitted in another tab', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [{ title: 'Bộ ba tab', content: set([q('Một'), q('Hai')]) }]);
  const setId = d.sets[0]!;
  const { page: tabA, ctx } = await hvPage(browser, d.students[0]!);
  await tabA.goto(S05(d.cls, setId));
  await tabA.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await tabA.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await expect(tabA.getByRole('status').filter({ hasText: /^Đã lưu$/ })).toBeVisible();
  const tabB = await ctx.newPage();
  await tabB.goto(S05(d.cls, setId));
  await tabB.getByRole('button', { name: 'Tiếp tục làm' }).click();
  const tabC = await ctx.newPage();
  await tabC.goto(S05(d.cls, setId));
  await expect(tabC.getByRole('button', { name: 'Tiếp tục làm' })).toBeVisible();

  // 1. Tab A submits.
  await tabA.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await tabA.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(tabA).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  const score = (await review(tabA, d.cls, setId)).body.score;
  // 2. Tab B answers / submits: refused.
  await tabB.getByRole('button', { name: 'Câu sau' }).click();
  await tabB.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await expect(tabB.getByRole('alert').filter({ hasText: DONE })).toBeVisible();
  await expect(tabB.getByRole('link', { name: 'Xem lại bài làm' })).toBeVisible();
  // "Nộp bài" can no longer submit anything there.
  await expect(tabB.getByRole('button', { name: 'Nộp bài', exact: true })).toBeDisabled();
  await expect(tabB.getByRole('alert').filter({ hasText: DONE })).toBeVisible();
  await evidence(tabB, 'TC-075', 1);
  // 3. Tab C still shows "Tiếp tục làm": pressing it is refused too.
  await tabC.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await tabC.waitForTimeout(1500);
  await evidence(tabC, 'TC-075', 2);
  // No new attempt, the score did not change.
  const after = (await review(tabA, d.cls, setId)).body;
  expect([after.submitted, after.score]).toEqual([true, score]);
  await expect(tabC.getByRole('alert').filter({ hasText: DONE }), 'tab C after "Tiếp tục làm"').toBeVisible();
  await expect(tabC.getByRole('link', { name: 'Xem lại bài làm' })).toBeVisible();
});
