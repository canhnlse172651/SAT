import { expect, test } from '@playwright/test';
import {
  T07, archiveItem, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, publishedSet, publishedStep, set, setBlock,
} from './helpers';

test('[005:AC-1.8] TC-015 "Mở bộ bài tập" of an archived set', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const s = await publishedStep(page, les.id, 'Bước S');
  const q = () => [mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])];
  await draftSet(page, les.id, 'Bộ khác', set(q()));
  const x = await publishedSet(page, les.id, 'Bộ X', set(q(), '', s));
  await archiveItem(page, les.id, x);

  await page.goto(T07(cur.id, les.id));
  // Unsaved changes in both tabs.
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  const sw = page.getByRole('switch', { name: /^Hiện mục lưu trữ/ });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await setBlock(page, 1).getByLabel('Tiêu đề', { exact: true }).fill('Bộ khác sửa');
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  const step = page.getByRole('region', { name: 'Bước học 1', exact: true });
  await step.getByLabel('Tên bước học').fill('Bước S sửa');

  // 1. "Mở bộ bài tập" of X on the Bài học tab.
  await step.getByRole('button', { name: /Mở bộ bài tập/ }).first().click();
  await expect(page.getByRole('tab', { name: /^Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  const xBlock = setBlock(page, 2);
  await expect(xBlock.getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ X');
  await expect(xBlock).toBeInViewport();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ khác sửa');
  await evidence(page, 'TC-015');
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  await expect(step.getByLabel('Tên bước học')).toHaveValue('Bước S sửa');
});
