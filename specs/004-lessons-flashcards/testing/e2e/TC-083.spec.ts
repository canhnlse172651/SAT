import { expect, test } from '@playwright/test';
import {
  S11,
  addStep,
  archiveStep,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  text,
} from './helpers';

test('[004:AC-14.1] [004:AC-14.7] [004:AC-14.8] TC-083 S03 header, Trước / Tiếp over visible steps, nothing tracked', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id, 'Bài chào hỏi');
  await publishedStep(page, les.id, 'Bước đầu', [text('<p>一</p>'), text('<p>二</p>', 't2')], 'Biết chào hỏi');
  await addStep(page, les.id); // draft in between
  await publishedStep(page, les.id, 'Bước cuối', [text('<p>三</p>')]);
  const archived = await publishedStep(page, les.id, 'Lưu trữ', [text('<p>四</p>')]);
  await archiveStep(page, les.id, archived);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  await hv.page.setViewportSize({ width: 360, height: 780 });
  const cls = await newClass(page, cur.id, [hv.who.user.id]);

  await hv.page.goto(S11(cls.id, les.id));
  await hv.page.getByRole('link', { name: /Bước đầu/ }).click();
  await expect(hv.page.getByText('Bài chào hỏi · Bước 1/2')).toBeVisible();
  await expect(hv.page.getByRole('heading', { name: 'Bước đầu' })).toBeVisible();
  await expect(hv.page.getByText('Mục tiêu: Biết chào hỏi')).toBeVisible();
  const blocks = await hv.page.locator('.sv-block').allInnerTexts();
  expect(blocks.map((t) => t.trim())).toEqual(['一', '二']);
  expect(await hv.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await expect(hv.page.getByRole('button', { name: /‹ Trước/ })).toHaveCount(0);
  await expect(hv.page.getByRole('button', { name: /Tiếp ›/ })).toContainText('Bước cuối');
  await expect(hv.page.getByText(/Đánh dấu đã học|Đã học \d+\/\d+/)).toHaveCount(0);
  await evidence(hv.page, 'TC-083', 1);

  await hv.page.getByRole('button', { name: /Tiếp ›/ }).click();
  await expect(hv.page.getByText('Bài chào hỏi · Bước 2/2')).toBeVisible();
  await expect(hv.page.getByRole('button', { name: /‹ Trước/ })).toContainText('Bước đầu');
  await expect(hv.page.getByRole('button', { name: /Tiếp ›/ })).toHaveCount(0);
  await evidence(hv.page, 'TC-083', 2);
  await hv.page.getByRole('button', { name: 'Về trang bài' }).click();
  await expect(hv.page).toHaveURL(new RegExp(`/bai/${les.id}$`));
});
