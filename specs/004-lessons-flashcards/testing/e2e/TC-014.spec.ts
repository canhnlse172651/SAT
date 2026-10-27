import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, gvPage, newCurriculum, newLesson, saveStep, text } from './helpers';

test('[004:AC-2.2] [004:AC-2.6] TC-014 T08, tab switch and reload with unsaved edits', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [text('<p>文</p>'), deck([{ id: 'c1', front: '你', pinyin: 'nǐ', meaning: 'bạn' }])],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên bước học').fill('Bước (đang sửa)');

  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Xong' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(step.getByLabel('Tên bước học')).toHaveValue('Bước (đang sửa)');

  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('tab', { name: /Bài học/ }).click();
  await expect(step.getByLabel('Tên bước học')).toHaveValue('Bước (đang sửa)');
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-014');

  let kind = '';
  page.once('dialog', (d) => {
    kind = d.type();
    void d.dismiss();
  });
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => kind).toBe('beforeunload');
});
