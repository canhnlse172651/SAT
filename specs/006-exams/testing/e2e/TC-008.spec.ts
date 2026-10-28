import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, freshStudents, gvPage, newClass, uid } from './helpers';

test('[006:AC-2.2] TC-008 "Lưu nháp" keeps everything, an incomplete question and an empty schedule included', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  const d = await draftExam(page, { name: `TC-008 ${t}`, content: { instructions: '', stepId: null, questions: [] } });
  await page.goto(T22(d.id));
  await page.getByLabel('Tên bài thi').fill(`TC-008 Đề ${t}`);
  await page.getByLabel('Hướng dẫn (tùy chọn)').fill('Không dùng từ điển');
  await page.getByRole('button', { name: 'Thêm câu hỏi' }).click();
  await page.getByRole('menuitem', { name: 'Trắc nghiệm', exact: true }).click();
  await page.getByRole('button', { name: 'Chọn lớp…' }).click();
  await page.getByRole('group', { name: 'Chọn lớp được giao' }).getByText(A.name).click();
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/^Đã lưu lúc \d\d:\d\d$/)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Tên bài thi')).toHaveValue(`TC-008 Đề ${t}`);
  await expect(page.getByLabel('Hướng dẫn (tùy chọn)')).toHaveValue('Không dùng từ điển');
  await expect(page.getByRole('region', { name: 'Câu 1' })).toBeVisible();
  await expect(page.getByText('Chưa hoàn chỉnh')).toBeVisible();
  await expect(page.getByRole('button', { name: `Bỏ lớp ${A.name}` })).toBeVisible();
  await expect(page.getByLabel('Giờ mở')).toHaveValue('');
  await expect(page.getByLabel('Thời lượng (phút)')).toHaveValue('');
  await expect(page.getByLabel('Giờ đóng')).toHaveValue('');
  await evidence(page, 'TC-008');
});
