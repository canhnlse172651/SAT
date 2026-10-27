import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, text } from './helpers';

test('[004:AC-1.4] [004:AC-2.1] TC-006 empty step name: incomplete, draft save allowed, publish refused', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Từ mới', { goal: '', blocks: [text('<p>你好</p>')] });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên bước học').fill('   ');
  await expect(step.getByText('Chưa hoàn chỉnh: Vui lòng nhập tên bước học')).toBeVisible();
  await expect(step.getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/Đã lưu lúc \d\d:\d\d/).first()).toBeVisible();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await expect(step.getByText('Nháp', { exact: true })).toBeVisible();
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(step.getByText('Không thể xuất bản — Chưa hoàn chỉnh: chưa có tên bước học')).toBeVisible();
  await expect(step.getByText('Nháp', { exact: true })).toBeVisible();
  await evidence(page, 'TC-006');
});
