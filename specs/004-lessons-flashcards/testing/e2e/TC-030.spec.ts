import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, text, vocab } from './helpers';

test('[004:AC-4.4] TC-030 incomplete fields allow a draft save; invalid values block it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Trống', {
    goal: '',
    blocks: [
      text('<p></p>'),
      vocab([{}]),
      { id: 'g', type: 'grammar', name: '', examples: [{ sentence: '吗', pinyin: '' }] },
      { id: 'd', type: 'dialogue', lines: [{ hanzi: '' }] },
    ],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  for (const msg of [
    'Chưa hoàn chỉnh: Khối văn bản chưa có chữ',
    'Chưa hoàn chỉnh: Vui lòng nhập chữ Hán',
    'Chưa hoàn chỉnh: Vui lòng nhập nghĩa',
    'Chưa hoàn chỉnh: Vui lòng nhập tên mẫu câu',
    'Chưa hoàn chỉnh: Vui lòng nhập lời thoại',
  ]) {
    await expect(step.getByText(msg).first()).toBeVisible();
  }
  await step.getByLabel('Mục tiêu bước học').fill('Đổi mục tiêu');
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await evidence(page, 'TC-030', 1);

  await step.getByLabel('Chữ Hán lời 1').fill('hello');
  await expect(step.getByText('Lời thoại phải có chữ Hán', { exact: true })).toBeVisible();
  await step.getByLabel('Pinyin ví dụ 1').fill('ni9');
  await step.getByLabel('Pinyin ví dụ 1').blur();
  await expect(step.getByText('Pinyin không hợp lệ: ni9', { exact: true })).toBeVisible();
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu được: Pinyin không hợp lệ: ni9')).toBeVisible();
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-030', 2);
});
