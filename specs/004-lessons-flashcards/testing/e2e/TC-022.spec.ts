import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, getLesson, gvPage, newCurriculum, newLesson, saveStep, text } from './helpers';

test('[004:AC-3.3] TC-022 delete a block without confirmation, effective on save', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [text('<p>chữ</p>'), deck([{ id: 'c1', front: '你', pinyin: 'nǐ', meaning: 'bạn' }])],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Xóa khối 2' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(step.getByText('Khối 2 · Bộ thẻ từ vựng')).toHaveCount(0);
  await expect(step.getByText('Khối 1 · Văn bản')).toBeVisible();
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(step.getByRole('button', { name: 'Xóa khối 1' })).toBeDisabled();
  expect((await getLesson(page, les.id)).items[0].content.blocks).toHaveLength(2);
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Bước học 1' }).getByText(/^Khối \d+ · /)).toHaveCount(1);
  await evidence(page, 'TC-022');
});
