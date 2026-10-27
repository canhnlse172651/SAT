import { expect, test } from '@playwright/test';
import { T07, aiApprove, evidence, gvPage, newCurriculum, newLesson, publishedStep, text, vocab } from './helpers';

test('[004:AC-9.1] [004:AC-9.4] TC-059 approved AI steps replace the section; only "AI tạo" ever', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Cũ 1', [text('<p>旧</p>')]);
  await publishedStep(page, les.id, 'Cũ 2', [text('<p>旧</p>')]);
  await aiApprove(page, les.id, [
    { title: 'AI 1', content: { goal: '', blocks: [vocab([{ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' }])] } },
    { title: 'AI 2', content: { goal: '', blocks: [text('<p>二</p>')] } },
    { title: 'AI 3', content: { goal: '', blocks: [text('<p>三</p>')] } },
  ]);
  await page.goto(T07(cur.id, les.id));
  const steps = page.getByRole('region', { name: /^Bước học \d+$/ });
  await expect(steps).toHaveCount(3);
  for (const [n, title] of [[1, 'AI 1'], [2, 'AI 2'], [3, 'AI 3']] as const) {
    const s = page.getByRole('region', { name: `Bước học ${n}` });
    await expect(s.getByLabel('Tên bước học')).toHaveValue(title);
    await expect(s.getByText('Đã xuất bản', { exact: true })).toBeVisible();
    await expect(s.getByText('AI tạo', { exact: true })).toBeVisible();
  }
  await evidence(page, 'TC-059', 1);
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  await s1.getByLabel('Nghĩa của từ 1').fill('chào bạn');
  await s1.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(s1.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await s1.getByRole('button', { name: 'Xuống dưới' }).click();
  await expect(page.getByText('Đã chuyển tới vị trí 2/3 · Đã lưu').first()).toBeVisible();
  const moved = page.getByRole('region', { name: 'Bước học 2' });
  await moved.getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByText('Đã lưu trữ · Đã lưu').first()).toBeVisible();
  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  await page.getByRole('region', { name: 'Bước học 2' }).getByRole('button', { name: 'Khôi phục' }).click();
  await expect(page.getByText('Đã khôi phục · Đã lưu').first()).toBeVisible();
  const again = page.getByRole('region', { name: 'Bước học 2' });
  await expect(again.getByLabel('Tên bước học')).toHaveValue('AI 1');
  await expect(again.getByText('AI tạo', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã chỉnh sửa')).toHaveCount(0);
  await evidence(page, 'TC-059', 2);
});
