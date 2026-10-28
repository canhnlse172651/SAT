/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T07, evidence, getLesson, gvPage, mcq, newCurriculum, newLesson, publishedSet, set, setBlock } from './helpers';

test('[005:AC-1.1] [005:AC-1.8] TC-001 add a set on the Bài tập tab', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedSet(page, les.id, 'Ôn chào hỏi', set([mcq('你好?', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }])]));

  // 1. Open T07, choose the "Bài tập" tab.
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  const bar = page.getByRole('toolbar', { name: 'Phần Bài tập' });
  await expect(bar).toContainText('1 bộ bài tập');
  await expect(bar).toContainText('1 Đã xuất bản');
  await expect(bar).toContainText('0 Nháp');
  await expect(bar.getByRole('button', { name: 'Thêm bộ bài tập' })).toBeVisible();
  // The set is editable in place.
  const first = setBlock(page, 1);
  await expect(first.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Ôn chào hỏi');
  await expect(first.getByLabel('Tiêu đề', { exact: true })).toBeEditable();

  // 2. "Thêm bộ bài tập".
  await bar.getByRole('button', { name: 'Thêm bộ bài tập' }).click();
  await expect(page.getByText('Đã thêm bộ bài tập mới (Nháp) · Đã lưu')).toBeVisible();
  const added = setBlock(page, 2);
  await expect(added).toBeVisible();
  await expect(added.getByText('Nháp', { exact: true })).toBeVisible();
  const title = added.getByLabel('Tiêu đề', { exact: true });
  await expect(title).toHaveValue('');
  await expect(title).toBeFocused();
  // Exactly one Trắc nghiệm question with 2 empty options.
  await expect(added.getByRole('region', { name: /^Câu \d+$/ })).toHaveCount(1);
  await expect(added.getByText('Câu 1 · Trắc nghiệm')).toBeVisible();
  await expect(added.getByRole('textbox', { name: /^Phương án [A-F]$/ })).toHaveCount(2);
  await expect(added.getByRole('textbox', { name: 'Phương án A' })).toHaveValue('');
  await expect(added.getByRole('textbox', { name: 'Phương án B' })).toHaveValue('');
  await expect(bar).toContainText('2 bộ bài tập');
  await expect(bar).toContainText('1 Nháp');
  // Saved at the end of the section.
  const l = await getLesson(page, les.id);
  const sets = l.items.filter((i: any) => i.section === 'exercise');
  expect(sets.map((i: any) => i.status)).toEqual(['published', 'draft']);
  await evidence(page, 'TC-001');
});
