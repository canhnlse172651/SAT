import { expect, test } from '@playwright/test';
import { T09, draftSet, evidence, gvPage, itemOf, newCurriculum, newLesson, set, setBlock, write } from './helpers';

test('[005:AC-2.6] [005:AC-10.2] TC-021 invalid "Pinyin đề" blocks save and publish', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await draftSet(page, les.id, 'Bộ viết', set([write('Viết', 'nǐ hǎo', ['你好'])]));
  await page.goto(T09(cur.id, les.id));
  const block = setBlock(page, 1);
  const field = block.getByRole('textbox', { name: 'Pinyin đề' });

  // 1. "hǎu", leave the field.
  await field.fill('hǎu');
  await block.getByLabel('Tiêu đề', { exact: true }).focus();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(block.getByText('Pinyin đề không hợp lệ: hǎu', { exact: true })).toBeVisible();
  // 2. "Lưu nháp" and "Xuất bản" are both refused, focus back on the field.
  for (const button of ['Lưu nháp', 'Xuất bản']) {
    await block.getByLabel('Tiêu đề', { exact: true }).focus();
    await block.getByRole('button', { name: button, exact: true }).click();
    await expect(block.getByText('Chưa lưu được: Pinyin đề không hợp lệ: hǎu')).toBeVisible();
    await expect(field).toBeFocused();
  }
  const saved = await itemOf(page, les.id, id);
  expect(saved.status).toBe('draft');
  expect(saved.content.questions[0].pinyin).toBe('nǐ hǎo');
  await evidence(page, 'TC-021');
});
