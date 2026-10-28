/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-1.11] TC-011 moving after the order changed elsewhere', async ({ browser }) => {
  const { page: tab1, ctx } = await gvPage(browser);
  const cur = await newCurriculum(tab1);
  const les = await newLesson(tab1, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(tab1, les.id, 'Bộ A', q());
  const b = await draftSet(tab1, les.id, 'Bộ B', q());
  const tab2 = await ctx.newPage();
  await tab1.goto(T09(cur.id, les.id));
  await tab2.goto(T09(cur.id, les.id));
  await expect(setBlock(tab2, 2)).toBeVisible();

  // 1. Tab 1 adds a set.
  await tab1.getByRole('toolbar', { name: 'Phần Bài tập' }).getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(tab1.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu')).toBeVisible();
  // 2. Tab 2 moves the first set down: nothing moves.
  await setBlock(tab2, 1).getByRole('button', { name: 'Xuống', exact: true }).click();
  await expect(
    tab2.getByText('Phần Bài tập đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất.').first(),
  ).toBeVisible();
  const l = await getLesson(tab1, les.id);
  const ids = l.items.filter((i: any) => i.section === 'exercise').map((i: any) => i.id);
  expect(ids.slice(0, 2)).toEqual([a, b]);
  await evidence(tab2, 'TC-011');
});
