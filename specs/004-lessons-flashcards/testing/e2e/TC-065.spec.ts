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

test('[004:AC-10.2] TC-065 an unlinked set leaves the step unchanged', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Từ mới', [text('<p>新</p>')]);
  const set = await addSet(page, les.id);
  await publishSet(page, les.id, set, 'Bộ liên kết');
  await linkPractice(page, set, step);
  await page.goto(T07(cur.id, les.id));
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  await expect(s1.getByRole('region', { name: 'Bài tập luyện tập' }).getByText('Bộ liên kết')).toBeVisible();

  await linkPractice(page, set, null);
  await page.reload();
  await expect(
    s1.getByText('Chưa có bộ bài tập nào liên kết với bước này. Liên kết được đặt khi soạn bộ bài tập (T09).'),
  ).toBeVisible();
  await expect(s1.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(s1.getByLabel('Tên bước học')).toHaveValue('Từ mới');
  await expect(s1.getByRole('textbox', { name: 'Nội dung khối 1' })).toHaveText('新');
  await evidence(page, 'TC-065');
});
