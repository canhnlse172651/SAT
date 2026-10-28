import { expect, test } from '@playwright/test';
import { T09, archiveItem, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, publishedSet, set, setBlock } from './helpers';

test('[005:AC-12.7] TC-058 a published or archived set must stay complete', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const pub = await publishedSet(page, les.id, 'Bộ xuất bản', q());
  const arc = await publishedSet(page, les.id, 'Bộ lưu trữ', q());
  await archiveItem(page, les.id, arc);
  await page.goto(T09(cur.id, les.id));
  await page.getByRole('switch', { name: /^Hiện mục lưu trữ/ }).click();

  for (const [n, id] of [[1, pub], [2, arc]] as const) {
    const block = setBlock(page, n);
    const q1 = block.getByRole('region', { name: 'Câu 1', exact: true });
    // Remove the correct answer (multi mode, uncheck, back to one answer).
    await q1.getByRole('radio', { name: 'Nhiều đáp án đúng' }).click();
    await q1.getByRole('checkbox', { name: 'Đáp án đúng A' }).uncheck();
    await q1.getByRole('radio', { name: 'Một đáp án đúng' }).click();
    await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
    const list = block.getByRole('alert').filter({ hasText: 'Chưa lưu được:' });
    await expect(list.getByRole('listitem')).toHaveText(['Câu 1: Hãy chọn đúng 1 đáp án đúng']);
    await expect(block.getByText('Chưa lưu', { exact: true })).toBeVisible();
    expect((await itemOf(page, les.id, id)).content.questions[0].options[0].correct).toBe(true);
  }
  await evidence(page, 'TC-058');
});
