import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, cloze, evidence, gvPage, hvPage, review, set } from './helpers';

test('[005:AC-6.4] [005:AC-6.5] TC-038 answering and grading blanks', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ điền', content: set([cloze('Điền vào', '我[[是]][[越南]][[人]]。')]) }]);
  const setId = d.sets[0]!;
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const box = (k: number) => page.getByRole('textbox', { name: `Câu 1 · chỗ trống ${k}` });

  // 1. Same width, ≤ 50 characters, Tab / "Tiếp" to the next blank.
  const widths = await Promise.all([1, 2, 3].map((k) => box(k).evaluate((el) => el.getBoundingClientRect().width)));
  expect(new Set(widths.map(Math.round)).size).toBe(1);
  await expect(box(1)).toHaveAttribute('maxlength', '50');
  await expect(box(1)).toHaveAttribute('enterkeyhint', 'next');
  await box(1).fill('');
  await box(1).pressSequentially('x'.repeat(51));
  await expect(box(1)).toHaveValue('x'.repeat(50));
  await box(1).fill('是');
  await box(1).press('Tab');
  await expect(box(2)).toBeFocused();
  await box(2).fill('中国');
  await box(2).press('Enter');
  await expect(box(3)).toBeFocused();
  await evidence(page, 'TC-038', 1);
  // 2. Submit: blank 1 right, blank 2 wrong, blank 3 empty.
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  const row = (await review(page, d.cls, setId)).body.rows[0];
  expect([row.earned, row.max]).toEqual([1, 3]);
  await expect(page.getByText(/điểm \(33%\)$/)).toBeVisible();
  await evidence(page, 'TC-038', 2);
  // Each blank has its result (AC-16.3): blank 2 "Sai", blank 3 "Chưa trả lời".
  const item = page.locator('li.ex-review__row').first();
  await expect(item).toContainText(/(chỗ trống 2|\(2\))[^;]*Sai/i);
  await expect(item).toContainText(/(chỗ trống 3|\(3\))[^;]*Chưa trả lời/i);
});
