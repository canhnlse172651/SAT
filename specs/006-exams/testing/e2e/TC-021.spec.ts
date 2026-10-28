import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, getExam, gvPage } from './helpers';

test('[006:AC-3.5] TC-021 "Lên lịch" with nothing set lists every unmet condition, each leading to its field', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page, { name: 'TC-021', content: { instructions: '', stepId: null, questions: [] } });
  await page.goto(T22(d.id));
  await page.getByLabel('Tên bài thi').fill('');
  await page.getByRole('button', { name: 'Lên lịch' }).click();
  const box = page.getByRole('alert').filter({ hasText: 'điều kiện chưa đạt' });
  await expect(box).toContainText('Chưa lên lịch được — còn 6 điều kiện chưa đạt:');
  for (const m of [
    'Tên bài thi bắt buộc, tối đa 150 ký tự',
    'Bài thi cần ít nhất 1 câu hỏi',
    'Chưa chọn lớp được giao',
    'Chưa nhập giờ mở',
    'Chưa nhập thời lượng làm bài',
    'Chưa nhập giờ đóng',
  ])
    await expect(box.getByRole('button', { name: m })).toBeVisible();
  await box.getByRole('button', { name: 'Chưa chọn lớp được giao' }).click();
  await expect(page.getByRole('button', { name: 'Chọn lớp…' })).toBeFocused();
  await box.getByRole('button', { name: 'Chưa nhập giờ mở' }).click();
  await expect(page.getByLabel('Giờ mở')).toBeFocused();
  expect((await getExam(page, d.id)).state).toBe('draft');
  await evidence(page, 'TC-021');
});
