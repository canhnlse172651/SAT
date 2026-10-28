import { expect, test } from '@playwright/test';
import { MIN, T22, evidence, freshStudents, getExam, gvPage, newClass, scheduledExam, vnInput } from './helpers';

test('[006:AC-4.1] TC-027 before any attempt everything is editable; without a class it is not saved', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const B = await newClass(page, [h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id], openIn: 24 * 60 });
  await page.goto(T22(ex.id));
  await page.getByRole('region', { name: 'Câu 1' }).getByRole('radio', { name: 'Đáp án đúng B' }).check();
  await page.getByLabel('Giờ mở').fill(vnInput(new Date(ex.opensAtDate.getTime() + 10 * MIN)));
  await page.getByRole('button', { name: 'Chọn lớp…' }).click();
  await page.getByRole('group', { name: 'Chọn lớp được giao' }).getByText(B.name).click();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(async () => (await getExam(page, ex.id)).classIds.sort()).toEqual([A.id, B.id].sort());
  const e = await getExam(page, ex.id);
  expect(e.opensAt).toBe(new Date(ex.opensAtDate.getTime() + 10 * MIN).toISOString());
  expect(e.content.questions[0].options[1].correct).toBe(true);
  await evidence(page, 'TC-027', 1);

  await page.getByRole('button', { name: `Bỏ lớp ${A.name}` }).click();
  await page.getByRole('button', { name: `Bỏ lớp ${B.name}` }).click();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'điều kiện chưa đạt' })).toContainText('Chưa chọn lớp được giao');
  expect((await getExam(page, ex.id)).classIds).toHaveLength(2);
  await evidence(page, 'TC-027', 2);
});
