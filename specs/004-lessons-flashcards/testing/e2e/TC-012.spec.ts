import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson } from './helpers';

test('[004:AC-2.1] [004:AC-2.5] TC-012 saving one step saves only that step', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  for (let i = 0; i < 3; i++) await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  for (const n of [1, 2, 3]) {
    await page.getByRole('region', { name: `Bước học ${n}` }).getByLabel('Tên bước học').fill(`Bước ${n}`);
  }
  const bar = page.getByRole('toolbar', { name: 'Phần Bài học' });
  await expect(bar).toContainText('3 mục chưa lưu');
  await page.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(bar).toContainText('2 mục chưa lưu');
  await expect(page.getByRole('region', { name: 'Bước học 2' }).getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Bước học 3' }).getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-012', 1);
  for (const n of [1, 3]) {
    await page.getByRole('region', { name: `Bước học ${n}` }).getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(page.getByRole('region', { name: `Bước học ${n}` }).getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  }
  await expect(bar).toContainText(/Đã lưu lúc \d\d:\d\d/);
  await evidence(page, 'TC-012', 2);
});
