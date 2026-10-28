import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, set, setContent, view } from './helpers';

test('[005:AC-14.4] TC-070 answers are saved within 3 seconds', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ lưu', content: set([mcq('Câu?', [{ text: 'Một' }, { text: 'Hai', correct: true }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const { page, ctx } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const status = page.getByRole('status').filter({ hasText: /Đang lưu…|Đã lưu/ });

  // 1. Choose an answer and watch the save state.
  const t0 = Date.now();
  await page.getByRole('radio', { name: /^B\s*Hai/ }).click();
  await expect(page.getByText('Đang lưu…')).toBeVisible();
  await expect(status).toHaveText('Đã lưu', { timeout: 3000 });
  expect(Date.now() - t0).toBeLessThanOrEqual(3000);
  await evidence(page, 'TC-070');
  // 2. Another tab reads the attempt.
  const other = await ctx.newPage();
  const v = await view(other, d.cls, setId);
  expect(v.body.attempt.answers[q.id].optionIds).toEqual([q.options[1].id]);
});
