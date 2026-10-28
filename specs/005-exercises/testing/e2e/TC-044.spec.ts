import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, match, mcq, set } from './helpers';

test('[005:AC-8.4] [005:AC-14.7] TC-044 Cột B order and links survive another device', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ nối',
      content: set([
        mcq('Câu đầu', [{ text: 'Đúng', correct: true }, { text: 'Sai' }]),
        match('Nối từ với nghĩa', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt'], ['老师', 'giáo viên']], ['học sinh']),
      ]),
    },
  ]);
  const setId = d.sets[0]!;
  const one = await hvPage(browser, d.students[0]!);
  const page = one.page;
  const colA = () => page.getByRole('group', { name: 'Cột A' }).getByRole('button');
  const colB = () => page.getByRole('group', { name: 'Cột B' }).getByRole('button');

  // 1. Start; note Cột B.
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(colA()).toHaveText(['你好', '谢谢', '再见', '老师']);
  await expect(colB()).toHaveCount(5);
  const order = (await colB().allTextContents()).map((t) => t.trim());
  expect(order.slice(0, 4)).not.toEqual(['xin chào', 'cảm ơn', 'tạm biệt', 'giáo viên']);
  expect([...order].sort()).toEqual(['cảm ơn', 'giáo viên', 'học sinh', 'tạm biệt', 'xin chào'].sort());
  // 2. Link 2 pairs, wait for the save, close the browser.
  await colA().nth(0).click();
  await page.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: 'xin chào' }).click();
  await colA().nth(1).click();
  await page.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: 'cảm ơn' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible();
  await evidence(page, 'TC-044', 1);
  await one.ctx.close();

  // 3. Another device (new context), "Tiếp tục làm".
  const two = await hvPage(browser, d.students[0]!);
  await two.page.goto(S05(d.cls, setId));
  await two.page.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(two.page.getByText('Câu 2/2')).toBeVisible();
  const b2 = two.page.getByRole('group', { name: 'Cột B' }).getByRole('button');
  expect((await b2.allTextContents()).map((t) => t.replace(/^\d+/, '').trim())).toEqual(order);
  await expect(two.page.getByRole('button', { name: '你好 · cặp 1' })).toBeVisible();
  await expect(two.page.getByRole('button', { name: 'xin chào · cặp 1' })).toBeVisible();
  await expect(two.page.getByRole('button', { name: '谢谢 · cặp 2' })).toBeVisible();
  await expect(two.page.getByRole('button', { name: 'cảm ơn · cặp 2' })).toBeVisible();
  await evidence(two.page, 'TC-044', 2);
});
