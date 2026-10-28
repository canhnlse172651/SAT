import { expect, test } from '@playwright/test';
import { S05, b6, classWithSets, evidence, gvPage, hvPage } from './helpers';

test('[005:AC-14.2] [005:AC-14.3] TC-069 one question at a time and the question board', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ B6', content: b6() }]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const board = page.getByRole('navigation', { name: 'Bảng câu hỏi' });
  const no = (n: number, state: string) => board.getByRole('button', { name: `Câu ${n} · ${state}` });

  // 1. Start: question 1 of 7, previous / next.
  await expect(page.getByText('Câu 1/7')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Câu trước' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Câu sau' })).toBeEnabled();
  // 2. Q1 fully, Q3 partly (1 of 2 blanks), then the board to question 6.
  await page.getByRole('radio', { name: /^B\s*Xin chào/ }).click();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await expect(page.getByText('Câu 2/7')).toBeVisible();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await page.getByRole('textbox', { name: 'Câu 3 · chỗ trống 1' }).fill('是');
  await page.getByRole('button', { name: 'Câu sau' }).click();
  // Q4: 2 of 4 pairs → partial.
  const A = page.getByRole('group', { name: 'Cột A' }).getByRole('button');
  await A.nth(0).click();
  await page.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: 'xin chào' }).click();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  // Q5: every tile placed → complete.
  const bank = page.getByRole('group', { name: 'Câu 5 · ngân hàng mảnh' });
  for (const t of ['我', '是', '越南', '人']) await bank.getByRole('button', { name: t, exact: true }).click();
  await no(6, 'chưa trả lời').click();
  await expect(page.getByText('Câu 6/7')).toBeVisible();
  await expect(board.getByRole('button', { name: /^Câu 6 · / })).toHaveAttribute('aria-current', 'step');
  // Q7: 1 of 2 sub-questions → partial.
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await page.getByRole('region', { name: 'Câu 7.1', exact: true }).getByRole('radio', { name: /^B\s*Học sinh/ }).click();
  await expect(no(1, 'đã hoàn thành')).toBeVisible();
  await expect(no(2, 'chưa trả lời')).toBeVisible();
  await expect(no(3, 'trả lời một phần')).toBeVisible();
  await expect(no(4, 'trả lời một phần')).toBeVisible();
  await expect(no(5, 'đã hoàn thành')).toBeVisible();
  await expect(no(6, 'chưa trả lời')).toBeVisible();
  await expect(no(7, 'trả lời một phần')).toBeVisible();
  // The three states look different.
  const cls = async (n: number) => (await board.getByRole('button', { name: new RegExp(`^Câu ${n} · `) }).getAttribute('class')) ?? '';
  expect(new Set([await cls(1), await cls(2), await cls(3)].map((c) => c.replace(' ex-board__no--now', ''))).size).toBe(3);
  await evidence(page, 'TC-069');
});
