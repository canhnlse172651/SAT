import { expect, test } from '@playwright/test';
import { T22, clockOf, evidence, freshStudents, getExam, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-6.2] TC-041 an attempt started while the delete confirmation is open blocks the delete', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  await page.goto(T22(ex.id));
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  const hv = await hvPage(browser, h!);
  expect((await start(hv.page, ex.id, holder())).status).toBe(200);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(
    page.getByText('Bài thi đã có học viên làm bài nên không xóa được — hãy Lưu trữ sau khi bài thi đóng.'),
  ).toBeVisible();
  expect((await getExam(page, ex.id)).state).toBe('open');
  expect((await clockOf(hv.page, ex.id)).status).toBe('doing');
  await evidence(page, 'TC-041');
});
