import { expect, test } from '@playwright/test';
import { T07, addStep, archiveStep, evidence, gvPage, newCurriculum, newLesson, publishStep, text } from './helpers';

test('[004:AC-1.2] TC-005 at most 30 steps not archived', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const ids: string[] = [];
  for (let i = 0; i < 30; i++) ids.push(await addStep(page, les.id));
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('button', { name: 'Thêm bước học' }).click();
  await expect(page.getByText('Mỗi bài có tối đa 30 bước học.')).toBeVisible();
  await expect(page.getByRole('region', { name: /^Bước học \d+$/ })).toHaveCount(30);
  await evidence(page, 'TC-005', 1);

  await publishStep(page, les.id, ids[0]!, 'Lưu trữ', { goal: '', blocks: [text('<p>一</p>')] });
  await archiveStep(page, les.id, ids[0]!);
  await page.reload();
  await page.getByRole('button', { name: 'Thêm bước học' }).click();
  await expect(page.getByText('Đã thêm bước học mới (Nháp) · Đã lưu')).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Phần Bài học' })).toContainText('31 bước học');
  await evidence(page, 'TC-005', 2);
});
