import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-2.2] TC-017 reorder and delete questions', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = (p: string) => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  await draftSet(page, les.id, 'Bộ 3 câu', set([q('Một'), q('Hai'), q('Ba')]));
  await draftSet(page, les.id, 'Bộ 1 câu', set([q('Duy nhất')]));
  await page.goto(T09(cur.id, les.id));
  let asked = false;
  page.on('dialog', (d) => {
    asked = true;
    void d.dismiss();
  });
  const block = setBlock(page, 1);
  const prompt = (n: number) => block.getByRole('region', { name: `Câu ${n}`, exact: true }).getByLabel('Đề bài');

  // 1. "Xuống dưới" on question 1.
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('button', { name: 'Xuống dưới', exact: true }).click();
  await expect(prompt(1)).toHaveValue('Hai');
  await expect(prompt(2)).toHaveValue('Một');
  await expect(prompt(3)).toHaveValue('Ba');
  // 2. "Xóa câu" on question 2: no confirmation, renumbered.
  await block.getByRole('region', { name: 'Câu 2', exact: true }).getByRole('button', { name: 'Xóa câu' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(block.getByRole('region', { name: /^Câu \d+$/ })).toHaveCount(2);
  await expect(prompt(1)).toHaveValue('Hai');
  await expect(prompt(2)).toHaveValue('Ba');
  await expect(block.getByText('Câu 2 · Trắc nghiệm')).toBeVisible();
  expect(asked).toBe(false);
  // 3. The 1-question set: not deleted.
  const one = setBlock(page, 2);
  await one.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('button', { name: 'Xóa câu' }).click();
  await expect(page.getByText('Bộ bài tập cần ít nhất 1 câu hỏi.')).toBeVisible();
  await expect(one.getByRole('region', { name: /^Câu \d+$/ })).toHaveCount(1);
  await evidence(page, 'TC-017');
});
