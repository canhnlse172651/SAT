import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, vocab } from './helpers';

test('[004:AC-4.6] TC-032 a deck made from the vocabulary list', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bài 1 · Chào hỏi', {
    goal: '',
    blocks: [
      vocab([
        { hanzi: '你好', pinyin: 'nǐ hǎo', pos: 'Cụm từ', meaning: 'xin chào', example: '你好！' },
        { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'chào' },
        { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn' },
      ]),
    ],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Tạo bộ thẻ từ danh sách này' }).click();
  await expect(step.getByText('Khối 2 · Bộ thẻ từ vựng')).toBeVisible();
  await expect(step.locator('.st-block').nth(1)).toContainText('Từ vựng – Bài 1 · Chào hỏi');
  await expect(step.locator('.st-block').nth(1)).toContainText('2 thẻ');
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *')).toHaveCount(2);
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *').nth(0)).toHaveValue('你好');
  await expect(dialog.getByLabel('Nghĩa *').nth(0)).toHaveValue('xin chào');
  await expect(dialog.getByLabel('Ví dụ').nth(0)).toHaveValue('你好！');
  await expect(dialog.getByLabel('Mặt trước (chữ Hán) *').nth(1)).toHaveValue('谢谢');
  await expect(dialog.getByText('Cụm từ')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Xong' }).click();
  await step.getByLabel('Nghĩa của từ 3').fill('cảm ơn bạn');
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await expect(page.getByRole('dialog').getByLabel('Nghĩa *').nth(1)).toHaveValue('cảm ơn');
  await evidence(page, 'TC-032');
});
