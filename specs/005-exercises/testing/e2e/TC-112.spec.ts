import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, set, view } from './helpers';

test('[005:AC-23.7] [005:AC-23.8] TC-112 a set without a deadline is not open', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [
    { title: 'Bộ có hạn', content: set([q('Một')]) },
    { title: 'Bộ chưa mở', content: set([q('Câu ẩn một'), q('Câu ẩn hai')], 'Hướng dẫn Y'), deadline: null },
  ]);
  const { page } = await hvPage(browser, d.students[0]!);
  const main = page.locator('[data-screen="S05"]');
  // 1. X.
  await page.goto(S05(d.cls, d.sets[0]!));
  await expect(main.getByText('Chưa làm', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Bắt đầu làm' })).toBeVisible();
  // 2. Y by its link.
  await page.goto(S05(d.cls, d.sets[1]!));
  await expect(main.getByText('Bài 1', { exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Bộ chưa mở' })).toBeVisible();
  await expect(main.getByText('Hướng dẫn Y')).toBeVisible();
  await expect(main.getByRole('definition').nth(0)).toHaveText('2');
  await expect(main.getByRole('definition').nth(1)).toHaveText(/^2(,0)?$/);
  await expect(main.locator('.hv-row__chips .chip').first()).toHaveText('Chưa mở');
  await expect(main.getByText('Giáo viên chưa đặt hạn nộp')).toBeVisible();
  for (const name of ['Bắt đầu làm', 'Tiếp tục làm']) await expect(main.getByRole('button', { name })).toHaveCount(0);
  await expect(page.getByText(/Câu ẩn/)).toHaveCount(0);
  await evidence(page, 'TC-112');
  expect((await view(page, d.cls, d.sets[1]!)).body.hasAttempt).toBe(false);
});
