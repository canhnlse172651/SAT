import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, set, setContent, view } from './helpers';

test('[005:AC-14.5] TC-071 offline answers are kept and retried', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ mạng', content: set([mcq('Câu?', [{ text: 'Một' }, { text: 'Hai', correct: true }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const { page, ctx } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();

  // 1. Offline, answer.
  await ctx.setOffline(true);
  await page.getByRole('radio', { name: /^B\s*Hai/ }).click();
  await expect(page.getByText('Mất kết nối – câu trả lời chưa được lưu')).toBeVisible();
  await expect(page.getByRole('radio', { name: /^B\s*Hai/ })).toBeChecked();
  await evidence(page, 'TC-071', 1);
  // 2. Online: retried by itself.
  await ctx.setOffline(false);
  await expect(page.getByRole('status').filter({ hasText: /^Đã lưu$/ })).toBeVisible({ timeout: 10_000 });
  const v = await view(page, d.cls, setId);
  expect(v.body.attempt.answers[q.id].optionIds).toEqual([q.options[1].id]);
  await evidence(page, 'TC-071', 2);
});
