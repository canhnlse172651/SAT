import { expect, test } from '@playwright/test';
import { T10, T22, draftExam, evidence, freshStudents, gvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-1.6] TC-006 name opens T22, "Xem kết quả" opens T16, none on a draft', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  await draftExam(page, { name: `TC-006 N ${t}` });
  const s = await scheduledExam(page, { name: `TC-006 S ${t}`, classIds: [A.id], openIn: 24 * 60 });

  await page.goto(T10);
  await page.getByRole('link', { name: `TC-006 S ${t}` }).click();
  await expect(page).toHaveURL(new RegExp(`${T22(s.id)}$`));
  await expect(page.getByRole('heading', { name: 'Soạn bài thi' })).toBeVisible();
  await page.goto(T10);
  await page.locator('tr', { hasText: `TC-006 S ${t}` }).getByRole('link', { name: 'Xem kết quả' }).click();
  await expect(page).toHaveURL(new RegExp(`/gv/bai-thi/${s.id}/ket-qua$`));
  await expect(page.getByRole('heading', { name: 'Kết quả bài thi' })).toBeVisible();
  await page.goto(T10);
  await expect(page.locator('tr', { hasText: `TC-006 N ${t}` })).toBeVisible();
  await expect(page.locator('tr', { hasText: `TC-006 N ${t}` }).getByRole('link', { name: 'Xem kết quả' })).toHaveCount(0);
  await evidence(page, 'TC-006');
});
