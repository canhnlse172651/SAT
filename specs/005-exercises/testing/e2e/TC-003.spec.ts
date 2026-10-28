/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, addItem, archiveItem, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, publishItem, set, setBlock } from './helpers';

test('[005:AC-1.2] TC-003 at most 30 sets that are not archived', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const content = set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  // 1 archived set + 30 sets not archived (the first two published).
  const old = await addItem(page, les.id, 'exercise');
  await publishItem(page, les.id, old, 'Bộ lưu trữ', content);
  await archiveItem(page, les.id, old);
  const ids: string[] = [];
  for (let k = 0; k < 30; k++) ids.push(await addItem(page, les.id, 'exercise'));
  await publishItem(page, les.id, ids[0]!, 'Bộ 1', content);
  await publishItem(page, les.id, ids[1]!, 'Bộ 2', content);

  await page.goto(T09(cur.id, les.id));
  const bar = page.getByRole('toolbar', { name: 'Phần Bài tập' });
  const limit = page.getByText('Mỗi bài có tối đa 30 bộ bài tập.');
  // 1. "Thêm bộ bài tập" can be pressed, adds nothing.
  await expect(bar.getByRole('button', { name: 'Thêm bộ bài tập' })).toBeEnabled();
  await bar.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(limit.first()).toBeVisible();
  // 2. "Thêm sau" on a set (blocks are numbered in section order, the hidden archived set is 1).
  await expect(setBlock(page, 4).getByRole('button', { name: 'Thêm sau' })).toBeEnabled();
  await setBlock(page, 4).getByRole('button', { name: 'Thêm sau' }).click();
  await expect(limit.first()).toBeVisible();
  // 3. "Nhân bản" on a saved set.
  await setBlock(page, 2).getByRole('button', { name: 'Nhân bản' }).click();
  await expect(limit.first()).toBeVisible();
  await evidence(page, 'TC-003', 1);
  let l = await getLesson(page, les.id);
  expect(l.items.filter((i: any) => i.section === 'exercise')).toHaveLength(31);

  // Archiving one set frees a place.
  await setBlock(page, 3).getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByText('Đã lưu trữ · Đã lưu')).toBeVisible();
  await bar.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu')).toBeVisible();
  l = await getLesson(page, les.id);
  expect(l.items.filter((i: any) => i.section === 'exercise')).toHaveLength(32);
  await evidence(page, 'TC-003', 2);
});
