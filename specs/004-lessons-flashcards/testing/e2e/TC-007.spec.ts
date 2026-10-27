import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-1.4] [004:AC-2.8] TC-007 name over 100 characters blocks the save', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên bước học').fill('x'.repeat(101));
  await expect(step.getByText('Tên bước học tối đa 100 ký tự', { exact: true })).toBeVisible();
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu được: Tên bước học tối đa 100 ký tự')).toBeVisible();
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-007');
});
