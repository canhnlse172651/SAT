import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, evidence, gvPage, hvPage, review, set, vocab } from './helpers';

test('[005:AC-5.5] TC-035 a Chọn nghĩa question on the phone', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ từ vựng',
      content: set([vocab('meaning', { word: '你好', wordPinyin: 'ni3 hao3' }, [{ text: 'tạm biệt' }, { text: 'xin chào', correct: true }])]),
    },
  ]);
  const setId = d.sets[0]!;
  // 1. The question at 390 px.
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const q = page.getByRole('region', { name: 'Câu 1', exact: true });
  await expect(q.getByText('Chọn nghĩa đúng của từ')).toBeVisible();
  const word = q.locator('[lang="zh-Hans"]', { hasText: /^你好$/ });
  await expect(word).toBeVisible();
  const size = await word.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(32);
  await expect(q.getByText('nǐ hǎo', { exact: true })).toBeVisible();
  await evidence(page, 'TC-035', 1);
  // 2. Choose the right meaning and submit: graded as a one-answer question.
  await q.getByRole('radio', { name: /^A\s/ }).click();
  await q.getByRole('radio', { name: /^B\s*xin chào/ }).click();
  await expect(q.getByRole('radio', { name: /^A\s/ })).not.toBeChecked();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  await expect(page.getByText(/điểm \(100%\)$/)).toBeVisible();
  const r = (await review(page, d.cls, setId)).body.rows[0];
  expect([r.earned, r.verdict]).toEqual([1, 'correct']);
  await evidence(page, 'TC-035', 2);
});
