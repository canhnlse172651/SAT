import { expect, test } from '@playwright/test';
import { T07, evidence, gvPage, newCurriculum, newLesson, publishedStep, text } from './helpers';

test('[004:AC-1.6] TC-010 notice of a draft Bài', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Một', [text('<p>一</p>')]);
  await page.goto(T07(cur.id, les.id));
  await expect(
    page.getByText(
      'Bài chưa xuất bản — học viên chưa thấy bước học nào của Bài này, kể cả bước đã xuất bản.',
    ),
  ).toBeVisible();
  await evidence(page, 'TC-010');
});
