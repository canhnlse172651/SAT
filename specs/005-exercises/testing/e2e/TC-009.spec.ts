import { expect, test } from '@playwright/test';
import {
  T09, addItem, archiveItem, evidence, gvPage, mcq, newCurriculum, newLesson, publishItem, publishedStep, set, setBlock,
} from './helpers';

test('[005:AC-1.9] [005:AC-1.12] TC-009 empty section and archived sets', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const empty = await newLesson(page, cur.id, 'Bài trống');
  const other = await newLesson(page, cur.id, 'Bài kia');
  const x = await addItem(page, other.id, 'exercise');
  await publishItem(page, other.id, x, 'Bộ cũ', set([mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await archiveItem(page, other.id, x);
  // An archived step too: its own switch must not change.
  const st = await publishedStep(page, other.id, 'Bước cũ');
  await archiveItem(page, other.id, st);

  // 1. The new Bài.
  await page.goto(T09(cur.id, empty.id));
  await expect(page.getByText('Chưa có bộ bài tập nào — bấm “Thêm bộ bài tập”.')).toBeVisible();
  await evidence(page, 'TC-009', 1);
  // 2. The other Bài: only an archived set.
  await page.goto(T09(cur.id, other.id));
  await expect(page.getByRole('heading', { name: 'Soạn bài thủ công' })).toBeVisible();
  const sw = page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText(/Chưa có bộ bài tập nào/)).toHaveCount(0);
  await expect(setBlock(page, 1)).toHaveCount(0);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(setBlock(page, 1)).toBeVisible();
  await expect(setBlock(page, 1).getByText('Lưu trữ', { exact: true }).first()).toBeVisible();
  await expect(setBlock(page, 1).getByLabel('Tiêu đề', { exact: true })).toHaveValue('Bộ cũ');
  await evidence(page, 'TC-009', 2);
  // The Bài học tab's switch is unchanged.
  await page.getByRole('tab', { name: /^Bài học/ }).click();
  await expect(page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' })).toHaveAttribute('aria-checked', 'false');
});
