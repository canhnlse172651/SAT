import { expect, test } from '@playwright/test';
import { T07, addStep, api, evidence, gvPage, newCurriculum, newLesson, text } from './helpers';

test('[004:AC-1.7] TC-011 every step editable in one frame with its labels and actions', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const ai = {
    lessonId: les.id,
    section: 'lesson',
    items: [
      { title: 'AI một', content: { goal: '', blocks: [text('<p>AI 1</p>')] } },
      { title: 'AI hai', content: { goal: '', blocks: [text('<p>AI 2</p>')] } },
    ],
  };
  const preview = await api(page, 'POST', '/api/dev/curriculum/ai-approve/preview', ai);
  await api(page, 'POST', '/api/dev/curriculum/ai-approve', { ...ai, token: preview.token });
  await addStep(page, les.id); // step 3: draft, no name → incomplete

  await page.goto(T07(cur.id, les.id));
  const steps = page.getByRole('region', { name: /^Bước học \d+$/ });
  await expect(steps).toHaveCount(3);
  await page.getByRole('region', { name: 'Bước học 2' }).getByLabel('Tên bước học').fill('AI hai (sửa)');
  await page
    .getByRole('region', { name: 'Bước học 3' })
    .getByRole('textbox', { name: 'Nội dung khối 1' })
    .fill('Thêm chữ');
  for (const n of [1, 2, 3]) {
    const s = page.getByRole('region', { name: `Bước học ${n}` });
    await expect(s.getByLabel('Tên bước học')).toBeEditable();
    await expect(s.getByRole('button', { name: 'Lên trên' })).toBeVisible();
    await expect(s.getByRole('button', { name: 'Xuống dưới' })).toBeVisible();
    await expect(s.getByRole('button', { name: 'Thêm sau' })).toBeVisible();
    await expect(s.getByRole('button', { name: 'Xóa', exact: true })).toBeVisible();
    await expect(s.getByRole('button', { name: 'Bỏ thay đổi' })).toHaveCount(0);
  }
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  await expect(s1.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(s1.getByText('AI tạo', { exact: true })).toBeVisible();
  await expect(s1.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
  await expect(s1.getByRole('button', { name: 'Lưu trữ' })).toBeVisible();
  const s2 = page.getByRole('region', { name: 'Bước học 2' });
  await expect(s2.getByText('Chưa lưu', { exact: true })).toBeVisible();
  const s3 = page.getByRole('region', { name: 'Bước học 3' });
  await expect(s3.getByText('Nháp', { exact: true })).toBeVisible();
  await expect(s3.getByText('Chưa hoàn chỉnh', { exact: true })).toBeVisible();
  await expect(s3.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await expect(s3.getByText('AI tạo', { exact: true })).toHaveCount(0);
  await expect(s3.getByRole('button', { name: 'Lưu nháp' })).toBeVisible();
  await expect(s3.getByRole('button', { name: 'Xuất bản' })).toBeVisible();
  await evidence(page, 'TC-011');
});
