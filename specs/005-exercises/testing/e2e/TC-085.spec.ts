import { expect, test } from '@playwright/test';
import { T09, b6, evidence, gvPage, newCurriculum, newLesson, publishedSet, setBlock } from './helpers';

test('[005:AC-16.6] TC-085 no setting to hide keys or explanations', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedSet(page, les.id, 'Bộ B6', b6());
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await expect(block.getByText('Câu 7 · Đọc hiểu')).toBeVisible();
  // Every switch / checkbox / option of the block: none is about showing or hiding keys or explanations.
  const names = [
    ...(await block.getByRole('switch').all()),
    ...(await block.getByRole('checkbox').all()),
    ...(await block.getByRole('button').all()),
    ...(await block.getByRole('combobox').all()),
  ];
  const labels: string[] = [];
  for (const el of names) labels.push(((await el.getAttribute('aria-label')) ?? (await el.textContent()) ?? '').trim());
  const options = await block.locator('option').allTextContents();
  for (const l of [...labels, ...options]) expect(l).not.toMatch(/(ẩn|hiện|hiển thị).*(đáp án|giải thích)|(đáp án|giải thích).*(sau khi|trước khi) nộp/i);
  await expect(block.getByRole('switch')).toHaveCount(0);
  await evidence(page, 'TC-085');
});
