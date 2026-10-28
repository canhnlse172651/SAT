/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, set, setBlock } from './helpers';

test('[005:AC-1.1] TC-002 "Thêm sau" keeps unsaved edits of another set', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(page, les.id, 'Bộ A', q());
  const b = await draftSet(page, les.id, 'Bộ B', q());
  await page.goto(T09(cur.id, les.id));
  // A has an unsaved change.
  await setBlock(page, 1).getByLabel('Tiêu đề', { exact: true }).fill('Bộ A đang soạn');
  await expect(setBlock(page, 1).getByText('Chưa lưu')).toBeVisible();

  // 1. "Thêm sau" on B.
  await setBlock(page, 2).getByRole('button', { name: 'Thêm sau' }).click();
  await expect(page.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu')).toBeVisible();
  await expect(setBlock(page, 3)).toBeVisible();
  await expect(setBlock(page, 3).getByText('Nháp', { exact: true })).toBeVisible();
  await expect(setBlock(page, 3).getByLabel('Tiêu đề', { exact: true })).toHaveValue('');
  // A is still unsaved with what is being typed.
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ A đang soạn');
  await expect(setBlock(page, 1).getByText('Chưa lưu')).toBeVisible();
  const l = await getLesson(page, les.id);
  const ids = l.items.filter((i: any) => i.section === 'exercise').map((i: any) => i.id);
  expect(ids.slice(0, 2)).toEqual([a, b]);
  expect(ids).toHaveLength(3);
  expect(l.items.find((i: any) => i.id === ids[2]).status).toBe('draft');
  expect(l.items.find((i: any) => i.id === a).title).toBe('Bộ A');
  await evidence(page, 'TC-002');
});
