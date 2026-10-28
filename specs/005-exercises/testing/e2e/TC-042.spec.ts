import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

const RULE = 'Câu nối cặp cần từ 2 đến 8 cặp';

test('[005:AC-8.1] [005:AC-8.2] TC-042 composing a matching question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ nối', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  await block.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Nối cặp' }).click();
  const q = block.getByRole('region', { name: 'Câu 2', exact: true });
  const told = async (button: ReturnType<typeof q.getByRole>) =>
    (await q.getByText(RULE).count()) > 0 || (await button.getAttribute('title')) === RULE;

  // 1. Defaults.
  await expect(q.getByRole('textbox', { name: 'Tiêu đề Cột A' })).toHaveValue('Cột A');
  await expect(q.getByRole('textbox', { name: 'Tiêu đề Cột B' })).toHaveValue('Cột B');
  await expect(q.getByRole('textbox', { name: 'Tiêu đề Cột A' })).toHaveAttribute('maxlength', '30');
  // 2. Up to 8 pairs, 4 distractors.
  const pairsA = q.getByRole('textbox', { name: /^Cặp \d+ · Cột A$/ });
  const addPair = q.getByRole('button', { name: 'Thêm cặp' });
  while ((await pairsA.count()) < 8) await addPair.click();
  await expect(pairsA).toHaveCount(8);
  await expect(addPair).toBeDisabled();
  const addD = q.getByRole('button', { name: 'Thêm mục nhiễu' });
  for (let k = 0; k < 4; k++) await addD.click();
  await expect(q.getByRole('textbox', { name: /^Mục nhiễu \d+$/ })).toHaveCount(4);
  await expect(addD).toBeDisabled();
  // Points of the question = sum of the pairs.
  await q.getByRole('textbox', { name: 'Điểm cặp 1' }).fill('2,5');
  await expect(q.getByText('9,5 điểm', { exact: true })).toBeVisible();
  await evidence(page, 'TC-042', 1);
  expect.soft(await told(addPair), `"${RULE}" when a 9th pair is refused`).toBe(true);
  // Back to 2 pairs: no further delete.
  while ((await pairsA.count()) > 2) await q.getByRole('button', { name: /^Xóa cặp \d+$/ }).last().click();
  const del2 = q.getByRole('button', { name: 'Xóa cặp 2' });
  await expect(del2).toBeDisabled();
  expect(await told(del2), `"${RULE}" when deleting at 2 pairs`).toBe(true);
  // 3. Pair 2 B empty, distractor 1 empty, two Cột A items "你好".
  await q.getByRole('textbox', { name: 'Cặp 1 · Cột A' }).fill('你好');
  await q.getByRole('textbox', { name: 'Cặp 1 · Cột B' }).fill('xin chào');
  await q.getByRole('textbox', { name: 'Cặp 2 · Cột A' }).fill('你好');
  await q.getByRole('textbox', { name: 'Cặp 2 · Cột B' }).fill('');
  await q.getByRole('textbox', { name: 'Mục nhiễu 1' }).fill('');
  await block.getByLabel('Tiêu đề', { exact: true }).focus();
  await expect(q).toContainText('Cặp 2: mục Cột B đang trống');
  await expect(q).toContainText('Mục nhiễu 1 đang trống');
  await expect(q).toContainText('Cột A có mục trùng nhau: 你好');
  await evidence(page, 'TC-042', 2);
});
