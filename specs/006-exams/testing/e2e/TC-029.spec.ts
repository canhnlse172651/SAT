import { expect, test } from '@playwright/test';
import { T22, evidence, freshStudents, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-4.2] TC-029 after the first attempt: lock banner, questions / open / duration read-only', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  expect((await start(hv.page, ex.id, holder())).status).toBe(200);

  await page.goto(T22(ex.id));
  await expect(
    page.getByText('Đề thi đã khóa vì đã có học viên bắt đầu làm bài. Chỉ sửa được tên, hướng dẫn, lớp được giao và lùi giờ đóng.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm câu hỏi' })).toBeDisabled();
  await expect(page.getByRole('region', { name: 'Câu 1' }).getByRole('button', { name: 'Xóa câu' })).toBeDisabled();
  await expect(page.getByRole('region', { name: 'Câu 1' }).getByLabel('Đề bài')).toBeDisabled();
  await expect(page.getByLabel('Giờ mở')).not.toBeEditable();
  await expect(page.getByLabel('Thời lượng (phút)')).not.toBeEditable();
  await expect(page.getByLabel('Tên bài thi')).toBeEditable();
  await expect(page.getByLabel('Hướng dẫn (tùy chọn)')).toBeEditable();
  await expect(page.getByLabel('Giờ đóng')).toBeEditable();
  await expect(page.getByRole('button', { name: 'Chọn lớp…' })).toBeEnabled();
  await evidence(page, 'TC-029');
});
