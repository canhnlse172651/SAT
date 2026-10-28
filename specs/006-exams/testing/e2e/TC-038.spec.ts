import { expect, test } from '@playwright/test';
import { T22, evidence, freshStudents, getExam, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-5.4] TC-038 a class with an attempt cannot be removed', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const B = await newClass(page, [h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id, B.id] });
  const hv = await hvPage(browser, h1!);
  expect((await start(hv.page, ex.id, holder())).status).toBe(200);
  await page.goto(T22(ex.id));
  await page.getByRole('button', { name: `Bỏ lớp ${A.name}` }).click();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(`Không thể bỏ lớp ${A.name} vì đã có học viên của lớp làm bài thi này.`)).toBeVisible();
  expect((await getExam(page, ex.id)).classIds).toContain(A.id);
  await evidence(page, 'TC-038');
});
