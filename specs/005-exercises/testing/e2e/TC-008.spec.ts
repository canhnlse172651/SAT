import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, itemOf, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-1.7] TC-008 a set saved in another window is not overwritten', async ({ browser }) => {
  const { page: tab1, ctx } = await gvPage(browser);
  const cur = await newCurriculum(tab1);
  const les = await newLesson(tab1, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(tab1, les.id, 'Bộ A', q());
  const b = await draftSet(tab1, les.id, 'Bộ B', q());
  const tab2 = await ctx.newPage();
  await tab1.goto(T09(cur.id, les.id));
  await tab2.goto(T09(cur.id, les.id));

  // 1. Tab 1 edits A and saves.
  await setBlock(tab1, 1).getByLabel('Tiêu đề', { exact: true }).fill('A từ tab 1');
  await setBlock(tab1, 1).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(tab1, 1).getByText(/^Đã lưu lúc/)).toBeVisible();
  // 2. Tab 2 edits A and B, saves A then B.
  await setBlock(tab2, 1).getByLabel('Tiêu đề', { exact: true }).fill('A từ tab 2');
  await setBlock(tab2, 2).getByLabel('Tiêu đề', { exact: true }).fill('B từ tab 2');
  await setBlock(tab2, 1).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(
    setBlock(tab2, 1).getByText('Bộ bài tập đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất.'),
  ).toBeVisible();
  await expect(setBlock(tab2, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('A từ tab 2');
  await setBlock(tab2, 2).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(tab2, 2).getByText(/^Đã lưu lúc/)).toBeVisible();
  expect((await itemOf(tab1, les.id, a)).title).toBe('A từ tab 1');
  expect((await itemOf(tab1, les.id, b)).title).toBe('B từ tab 2');
  await evidence(tab2, 'TC-008');
});
