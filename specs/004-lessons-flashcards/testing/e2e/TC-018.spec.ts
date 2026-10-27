import { expect, test } from '@playwright/test';
import { T07, addStep, evidence, gvPage, newCurriculum, newLesson, saveStep, vocab } from './helpers';

test('[004:AC-2.8] [004:AC-4.4] TC-018 an invalid value blocks only its own step', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const a = await addStep(page, les.id);
  await saveStep(page, les.id, a, 'Bước 1', {
    goal: '',
    blocks: [vocab([{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' }])],
  });
  await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  const s2 = page.getByRole('region', { name: 'Bước học 2' });
  await s1.getByLabel('Chữ Hán của từ 1').fill('abc');
  await expect(s1.getByText('Từ phải có chữ Hán', { exact: true })).toBeVisible();
  await s2.getByLabel('Tên bước học').fill('Bước 2');
  await s1.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(s1.getByText('Chưa lưu được: Từ phải có chữ Hán')).toBeVisible();
  await expect(s1.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await s2.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(s2.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await evidence(page, 'TC-018');
});
