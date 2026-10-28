/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  T09, archiveItem, draftSet, evidence, getLesson, gvPage, itemOf, mcq, newCurriculum, newLesson, publishedSet, set, setBlock,
} from './helpers';

test('[005:AC-12.9] TC-059 only the saved set is saved', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]);
  const a = await draftSet(page, les.id, 'Bộ A', q());
  const b = await draftSet(page, les.id, 'Bộ B', q());
  const old = await publishedSet(page, les.id, 'Bộ cũ', q());
  await archiveItem(page, les.id, old);
  const bBefore = await itemOf(page, les.id, b);
  await page.goto(T09(cur.id, les.id));
  await setBlock(page, 1).getByLabel('Tiêu đề', { exact: true }).fill('Bộ A sửa');
  await setBlock(page, 2).getByLabel('Tiêu đề', { exact: true }).fill('Bộ B sửa');

  // 1. "Lưu nháp" on A.
  await setBlock(page, 1).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(setBlock(page, 1).getByText(/^Đã lưu lúc/)).toBeVisible();
  // 2. Switch, tabs, up / down.
  await page.getByRole('switch', { name: /^Hiện mục lưu trữ/ }).click();
  await page.getByRole('switch', { name: /^Hiện mục lưu trữ/ }).click();
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  await setBlock(page, 2).getByRole('button', { name: 'Lên', exact: true }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 1/3 · Đã lưu').first()).toBeVisible();
  await setBlock(page, 2).getByRole('button', { name: 'Lên', exact: true }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 1/3 · Đã lưu').first()).toBeVisible();
  await evidence(page, 'TC-059');
  // 3. Read the Bài: A saved, B unchanged except for its place.
  expect((await itemOf(page, les.id, a)).title).toBe('Bộ A sửa');
  const bAfter = await itemOf(page, les.id, b);
  expect([bAfter.title, bAfter.content]).toEqual([bBefore.title, bBefore.content]);
  const l = await getLesson(page, les.id);
  expect(l.items.filter((i: any) => i.section === 'exercise').map((i: any) => i.id)).toEqual([a, b, old]);
});
