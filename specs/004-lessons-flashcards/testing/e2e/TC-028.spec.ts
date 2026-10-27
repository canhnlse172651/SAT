import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, getLesson, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

const grammar = (examples: number) => ({
  id: 'g',
  type: 'grammar',
  name: examples ? 'Đủ' : '',
  structure: '',
  explanation: '',
  examples: Array.from({ length: examples }, (_, i) => ({ sentence: `吗${i}`, pinyin: 'ma', meaning: 'x' })),
});

test('[004:AC-4.2] TC-028 grammar block fields and the 20 examples limit', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Ngữ pháp', { goal: '', blocks: [grammar(1)] });
  const full = await addStep(page, les.id);
  await saveStep(page, les.id, full, 'Đủ 20', { goal: '', blocks: [grammar(20)] });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên mẫu câu *').fill('Câu hỏi với 吗');
  await step.getByLabel('Cấu trúc').fill('Chủ ngữ + Động từ + Tân ngữ + 吗？');
  const expl = step.getByRole('textbox', { name: 'Giải thích' });
  await expl.click();
  await expl.pressSequentially('Thêm ');
  await expl.pressSequentially('吗');
  await expl.press('Shift+ArrowLeft');
  await step.getByRole('button', { name: 'Đậm', exact: true }).click();
  await step.getByLabel('Câu ví dụ 1').fill('你好吗？');
  await step.getByLabel('Pinyin ví dụ 1').fill('nǐ hǎo ma?');
  await step.getByLabel('Nghĩa ví dụ 1').fill('Bạn khỏe không?');
  await step.getByRole('button', { name: 'Thêm ví dụ' }).click();
  await step.getByLabel('Câu ví dụ 2').fill('他是老师吗？');
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  const g = (await getLesson(page, les.id)).items.find((i: { id: string }) => i.id === id).content.blocks[0];
  expect(g.name).toBe('Câu hỏi với 吗');
  expect(g.structure).toBe('Chủ ngữ + Động từ + Tân ngữ + 吗？');
  expect(g.explanation).toContain('<b>吗</b>');
  expect(g.examples).toHaveLength(2);
  await evidence(page, 'TC-028', 1);

  const big = page.getByRole('region', { name: 'Bước học 2' });
  await expect(big.getByRole('button', { name: 'Thêm ví dụ' })).toBeDisabled();
  await expect(big.getByText('Mỗi điểm ngữ pháp có tối đa 20 ví dụ')).toBeVisible();
  await evidence(page, 'TC-028', 2);
});
