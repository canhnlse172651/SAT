import { expect, test } from '@playwright/test';
import {
  T07,
  addSet,
  evidence,
  gvPage,
  linkPractice,
  newCurriculum,
  newLesson,
  publishSet,
  publishedStep,
  text,
} from './helpers';

test('[004:AC-10.1] TC-064 practice sets of a step, read only, "Mở bộ bài tập" switches tab', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Từ mới', [text('<p>新</p>')]);
  await publishedStep(page, les.id, 'Bước khác', [text('<p>另</p>')]);
  const a = await addSet(page, les.id);
  await publishSet(page, les.id, a, 'Luyện từ mới 1');
  const b = await addSet(page, les.id);
  await linkPractice(page, a, step);
  await linkPractice(page, b, step);

  await page.goto(T07(cur.id, les.id));
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  const practice = s1.getByRole('region', { name: 'Bài tập luyện tập' });
  await expect(practice.getByText('Luyện từ mới 1')).toBeVisible();
  await expect(practice.getByText('Đã xuất bản')).toBeVisible();
  await expect(practice.getByText('Nháp')).toBeVisible();
  await expect(practice.getByRole('button', { name: 'Mở bộ bài tập' })).toHaveCount(2);
  await expect(practice.getByRole('button', { name: /liên kết/i })).toHaveCount(0);
  await expect(
    page
      .getByRole('region', { name: 'Bước học 2' })
      .getByText('Chưa có bộ bài tập nào liên kết với bước này. Liên kết được đặt khi soạn bộ bài tập (T09).'),
  ).toBeVisible();
  await evidence(page, 'TC-064', 1);

  await page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên bước học').fill('Bước khác (chưa lưu)');
  await practice.getByRole('button', { name: 'Mở bộ bài tập' }).first().click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Bài tập/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`[data-item="${a}"]`)).toBeInViewport();
  await evidence(page, 'TC-064', 2);
  await page.getByRole('tab', { name: /Bài học/ }).click();
  await expect(page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên bước học')).toHaveValue('Bước khác (chưa lưu)');
});
