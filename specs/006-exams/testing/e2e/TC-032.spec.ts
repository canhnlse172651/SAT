import { expect, test } from '@playwright/test';
import { MIN, T22, advanceClock, evidence, freshStudents, getExam, gvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-4.4] TC-032 a closed exam: banner, only name and instructions', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, 2 * MIN);
  await page.goto(T22(ex.id));
  await expect(page.getByText('Bài thi đã đóng — không thể đổi đề, lớp được giao hoặc lịch.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm câu hỏi' })).toBeDisabled();
  await expect(page.getByLabel('Giờ mở')).not.toBeEditable();
  await expect(page.getByLabel('Thời lượng (phút)')).not.toBeEditable();
  await expect(page.getByLabel('Giờ đóng')).not.toBeEditable();
  await expect(page.getByRole('button', { name: 'Chọn lớp…' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: `Bỏ lớp ${A.name}` })).toHaveCount(0);
  const t = uid();
  await page.getByLabel('Tên bài thi').fill(`TC-032 ${t}`);
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(async () => (await getExam(page, ex.id)).name).toBe(`TC-032 ${t}`);
  await evidence(page, 'TC-032');
});
