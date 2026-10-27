import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-4.3] TC-029 dialogue / passage block and the 100 lines limit', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await addStep(page, les.id);
  const full = await addStep(page, les.id);
  await saveStep(page, les.id, full, 'Đủ 100', {
    goal: '',
    blocks: [{ id: 'd', type: 'dialogue', lines: Array.from({ length: 100 }, () => ({ hanzi: '你好' })) }],
  });
  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Thêm khối' }).click();
  await step.getByRole('group', { name: 'Chọn loại khối' }).getByRole('button', { name: 'Hội thoại / Bài khóa' }).click();
  const kind = step.getByRole('radiogroup', { name: 'Loại khối' });
  await expect(kind.getByRole('radio', { name: 'Hội thoại' })).toHaveAttribute('aria-checked', 'true');
  await step.getByLabel('Tiêu đề', { exact: true }).fill('Gặp nhau');
  await step.getByLabel('Người nói lời 1').fill('A');
  await step.getByLabel('Chữ Hán lời 1').fill('你好！');
  await step.getByRole('button', { name: 'Thêm dòng' }).click();
  await step.getByLabel('Người nói lời 2').fill('B');
  await step.getByLabel('Chữ Hán lời 2').fill('你好！');
  await expect(step.getByLabel('Pinyin lời 2')).toBeVisible();
  await expect(step.getByLabel('Bản dịch lời 2')).toBeVisible();
  await evidence(page, 'TC-029', 1);
  await kind.getByRole('radio', { name: 'Bài khóa' }).click();
  await expect(step.getByLabel(/^Người nói lời/)).toHaveCount(0);
  await expect(step.getByLabel('Chữ Hán lời 1')).toHaveValue('你好！');

  const big = page.getByRole('region', { name: 'Bước học 2' });
  await expect(big.getByRole('button', { name: 'Thêm dòng' })).toBeDisabled();
  await expect(big.getByText('Mỗi khối Hội thoại / Bài khóa có tối đa 100 dòng')).toBeVisible();
  await evidence(page, 'TC-029', 2);
});
