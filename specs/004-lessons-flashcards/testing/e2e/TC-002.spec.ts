import { expect, test } from '@playwright/test';
import { T07, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-1.1] TC-002 empty Bài học section', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await page.goto(T07(cur.id, les.id));
  await expect(page.getByText('Chưa có bước học nào — bấm “Thêm bước học”.')).toBeVisible();
  await evidence(page, 'TC-002');
});
