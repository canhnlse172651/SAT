import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, fileBlock, gvPage, newCurriculum, newLesson, publishedStep, saveStep, text, vocab } from './helpers';

test('[004:AC-7.1] [004:AC-7.2] TC-049 publishing refused with the issue list; an issue scrolls to its block', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Bước 1', [text('<p>一</p>')]);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước 2', {
    goal: '',
    blocks: [text('<p>二</p>'), vocab([{ hanzi: '你', meaning: '' }, { hanzi: '好', meaning: '' }]), fileBlock('video', null)],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 2' });
  await step.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(step.getByText('Không thể xuất bản — Chưa hoàn chỉnh: Khối 2 · Từ vựng: 2 từ chưa hợp lệ')).toBeVisible();
  await expect(step.getByText('Bước 2 · Khối 2 · Từ vựng: 2 từ chưa hợp lệ')).toBeVisible();
  const videoIssue = step.getByRole('button', { name: 'Bước 2 · Khối 3 · Video: chưa có tệp' });
  await expect(videoIssue).toBeVisible();
  await expect(step.getByText('Nháp', { exact: true })).toBeVisible();
  await evidence(page, 'TC-049', 1);
  await page.mouse.wheel(0, -5000);
  await videoIssue.click();
  await expect(step.locator('.st-block').nth(2)).toBeInViewport();
  await expect(step.getByText('Khối 3 · Video', { exact: true })).toBeInViewport();
  await evidence(page, 'TC-049', 2);
});
