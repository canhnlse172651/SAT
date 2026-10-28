import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, match, mcq, order, set, write } from './helpers';

test('[005:AC-14.7] [005:NFR-3] TC-073 resuming on another device', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ 5 câu',
      content: set([
        match('Nối', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt']]),
        order('Sắp xếp', ['我', '是', '越南', '人']),
        mcq('Ba', [{ text: 'Đúng', correct: true }, { text: 'Sai' }]),
        mcq('Bốn', [{ text: 'Đúng', correct: true }, { text: 'Sai' }]),
        write('Năm', 'nǐ', ['你']),
      ]),
    },
  ]);
  const setId = d.sets[0]!;
  const one = await hvPage(browser, d.students[0]!);
  const page = one.page;
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  // 1. Two pairs on Q1, tiles on Q2, stand on Q4, close the browser.
  const colB = () => page.getByRole('group', { name: 'Cột B' }).getByRole('button');
  await expect(colB()).toHaveCount(3);
  const bOrder = (await colB().allTextContents()).map((t) => t.trim());
  const A = page.getByRole('group', { name: 'Cột A' }).getByRole('button');
  await A.nth(0).click();
  await page.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: 'xin chào' }).click();
  await A.nth(1).click();
  await page.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: 'cảm ơn' }).click();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  const bank = page.getByRole('group', { name: 'Câu 2 · ngân hàng mảnh' });
  const bankOrder = (await bank.getByRole('button').allTextContents()).map((t) => t.trim());
  await bank.getByRole('button', { name: '我', exact: true }).click();
  await bank.getByRole('button', { name: '是', exact: true }).click();
  await page.getByRole('navigation', { name: 'Bảng câu hỏi' }).getByRole('button', { name: /^Câu 4 · / }).click();
  await expect(page.getByText('Câu 4/5')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /^Đã lưu$/ })).toBeVisible();
  await evidence(page, 'TC-073', 1);
  await one.ctx.close();

  // 2. Sign in again in a new context, S05, "Tiếp tục làm".
  const two = await hvPage(browser, d.students[0]!);
  const p2 = two.page;
  await p2.goto(S05(d.cls, setId));
  await p2.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(p2.getByText('Câu 4/5')).toBeVisible();
  await p2.getByRole('navigation', { name: 'Bảng câu hỏi' }).getByRole('button', { name: /^Câu 1 · / }).click();
  const b2 = (await p2.getByRole('group', { name: 'Cột B' }).getByRole('button').allTextContents()).map((t) => t.replace(/^\d+/, '').trim());
  expect(b2).toEqual(bOrder);
  await expect(p2.getByRole('button', { name: '你好 · cặp 1' })).toBeVisible();
  await expect(p2.getByRole('button', { name: 'cảm ơn · cặp 2' })).toBeVisible();
  await p2.getByRole('button', { name: 'Câu sau' }).click();
  const line = p2.getByRole('group', { name: 'Câu 2 · dòng trả lời' });
  expect((await line.getByRole('button').allTextContents()).map((t) => t.trim())).toEqual(['我', '是']);
  const rest = (await p2.getByRole('group', { name: 'Câu 2 · ngân hàng mảnh' }).getByRole('button').allTextContents()).map((t) => t.trim());
  expect(rest).toEqual(bankOrder.filter((t) => t !== '我' && t !== '是'));
  await evidence(p2, 'TC-073', 2);
});
