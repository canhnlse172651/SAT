import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, vocab } from './helpers';

test('[004:AC-4.1] TC-027 vocabulary block: fields, word classes, order, limit 100', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Từ', { goal: '', blocks: [vocab([{}])] });
  const full = await addStep(page, les.id);
  await saveStep(page, les.id, full, 'Đủ 100', {
    goal: '',
    blocks: [vocab(Array.from({ length: 100 }, (_, i) => ({ hanzi: `字${i}`, meaning: `nghĩa ${i}` })))],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  const word = async (n: number, hanzi: string, pinyin: string, meaning: string) => {
    await step.getByLabel(`Chữ Hán của từ ${n}`).fill(hanzi);
    await step.getByLabel(`Pinyin của từ ${n}`).fill(pinyin);
    await step.getByLabel(`Nghĩa của từ ${n}`).fill(meaning);
    await step.getByLabel(`Ví dụ của từ ${n}`).fill(`${hanzi}很好。`);
  };
  await word(1, '个', 'gè', 'cái');
  await step.getByRole('button', { name: 'Thêm từ' }).click();
  await word(2, '书', 'shū', 'sách');
  await step.getByRole('button', { name: 'Thêm từ' }).click();
  await word(3, '你', 'nǐ', 'bạn');
  const pos = step.getByLabel('Loại từ của từ 1');
  await expect(pos.locator('option')).toHaveText([
    '—',
    'Danh từ',
    'Động từ',
    'Tính từ',
    'Phó từ',
    'Đại từ',
    'Số từ',
    'Lượng từ',
    'Giới từ',
    'Liên từ',
    'Trợ từ',
    'Thán từ',
    'Động từ năng nguyện',
    'Cụm từ',
  ]);
  await pos.selectOption('Lượng từ');
  await step.getByRole('button', { name: 'Xuống (từ 1)' }).click();
  await expect(step.getByLabel('Chữ Hán của từ 2')).toHaveValue('个');
  await expect(step.getByLabel('Loại từ của từ 2')).toHaveValue('Lượng từ');
  await step.getByRole('button', { name: 'Lên (từ 3)' }).click();
  await expect(step.getByLabel('Chữ Hán của từ 2')).toHaveValue('你');
  await step.locator('.st-vocab .st-grip').nth(2).dragTo(step.locator('.st-vocab:not(.st-row--head)').nth(0));
  await expect(step.getByLabel('Chữ Hán của từ 1')).toHaveValue('个');
  await step.getByRole('button', { name: 'Xóa từ 1' }).click();
  await expect(step.getByLabel(/^Chữ Hán của từ \d+$/)).toHaveCount(2);
  await evidence(page, 'TC-027', 1);

  const big = page.getByRole('region', { name: 'Bước học 2' });
  await expect(big.getByRole('button', { name: 'Thêm từ' })).toBeDisabled();
  await expect(big.getByText('Mỗi khối Từ vựng có tối đa 100 từ')).toBeVisible();
  await evidence(page, 'TC-027', 2);
});
