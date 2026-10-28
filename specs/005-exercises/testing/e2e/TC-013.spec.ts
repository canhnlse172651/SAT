/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-1.14] [005:AC-12.10] TC-013 unsaved sets survive a tab switch', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  await draftSet(page, les.id, 'Bộ 1', q());
  await draftSet(page, les.id, 'Bộ 2', q());
  await draftSet(page, les.id, 'Bộ 3', q());
  await page.goto(T09(cur.id, les.id));
  let leave = false;
  page.on('dialog', (d) => {
    leave = true;
    void d.dismiss();
  });
  // Edit 2 sets, add a new one and edit it.
  await setBlock(page, 1).getByLabel('Tiêu đề', { exact: true }).fill('Bộ 1 sửa');
  await setBlock(page, 2).getByLabel('Hướng dẫn (tùy chọn)').fill('Hướng dẫn mới');
  await page.getByRole('toolbar', { name: 'Phần Bài tập' }).getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu')).toBeVisible();
  await setBlock(page, 4).getByLabel('Tiêu đề', { exact: true }).fill('Bộ mới');

  // 1. Switch to "Bài học". 2. Back to "Bài tập".
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  await expect(page.getByRole('toolbar', { name: 'Phần Bài học' })).toBeVisible();
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ 1 sửa');
  await expect(setBlock(page, 2).getByLabel('Hướng dẫn (tùy chọn)')).toHaveValue('Hướng dẫn mới');
  await expect(setBlock(page, 4).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ mới');
  for (const n of [1, 2, 4]) await expect(setBlock(page, n).getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: /^Bài tập · 3 chưa lưu/ })).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Phần Bài tập' })).toContainText('3 mục chưa lưu');
  expect(leave).toBe(false);
  await evidence(page, 'TC-013');
  // Nothing was saved.
  const l = await getLesson(page, les.id);
  const sets = l.items.filter((i: any) => i.section === 'exercise');
  expect(sets.map((i: any) => i.title)).toEqual(['Bộ 1', 'Bộ 2', 'Bộ 3', '']);
  expect(sets[1].content.instructions).toBe('');
});
