import { expect, test } from '@playwright/test';
import { T16, evidence, gvPage, inactiveStudent, newClass, scheduledExam } from './helpers';

test('[006:AC-15.6] TC-104 a class without activated students: "Lớp chưa có học viên"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const E = await newClass(page, [await inactiveStudent(page)]);
  const ex = await scheduledExam(page, { classIds: [E.id] });
  await page.goto(T16(ex.id));
  await expect(page.getByRole('heading', { name: 'Lớp chưa có học viên' })).toBeVisible();
  await expect(page.getByLabel('Số liệu của lớp')).toHaveCount(0);
  await expect(page.locator('table')).toHaveCount(0);
  await evidence(page, 'TC-104');
});
