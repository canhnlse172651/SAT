import { expect, test } from '@playwright/test';
import { T07, evidence, gvPage, newCurriculum, newLesson, publishedStep, text } from './helpers';

test('[004:AC-7.3] TC-051 a published step is saved only when it stays publishable', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Đã xuất bản', [text('<p>你好</p>')]);
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await expect(step.getByRole('button', { name: 'Lưu nháp' })).toHaveCount(0);
  const box = step.getByRole('textbox', { name: 'Nội dung khối 1' });
  await box.click();
  await box.press('Control+A');
  await box.press('Delete');
  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(step.getByText('Không thể xuất bản — Chưa hoàn chỉnh: Khối 1 · Văn bản: chưa có chữ')).toBeVisible();
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-051', 1);
  await box.pressSequentially('再见');
  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await evidence(page, 'TC-051', 2);
});
