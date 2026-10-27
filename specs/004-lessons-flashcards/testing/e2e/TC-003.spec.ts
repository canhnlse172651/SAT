import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, publishStep, text } from './helpers';

test('[004:AC-1.2] [004:AC-1.3] TC-003 add a step at the end', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const first = await addStep(page, les.id);
  await publishStep(page, les.id, first, 'Bước một', { goal: '', blocks: [text('<p>一</p>')] });
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('button', { name: 'Thêm bước học' }).click();
  await expect(page.getByText('Đã thêm bước học mới (Nháp) · Đã lưu')).toBeVisible();
  const step = page.getByRole('region', { name: 'Bước học 2' });
  await expect(step).toBeVisible();
  await expect(step.getByText('Nháp', { exact: true })).toBeVisible();
  const name = step.getByLabel('Tên bước học');
  await expect(name).toHaveValue('');
  await expect(name).toBeFocused();
  await expect(step.getByLabel('Mục tiêu bước học')).toHaveValue('');
  await expect(step.getByText(/^Khối \d+ · /)).toHaveCount(1);
  await expect(step.getByText('Khối 1 · Văn bản')).toBeVisible();
  await expect(step.getByRole('textbox', { name: 'Nội dung khối 1' })).toHaveText('');
  await evidence(page, 'TC-003');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Bước học 2' })).toBeVisible();
});
