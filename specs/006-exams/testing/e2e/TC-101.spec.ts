import { expect, test } from '@playwright/test';
import { T16, evidence, freshStudents, gvPage, newClass, scheduledExam } from './helpers';

test('[006:AC-15.3] TC-101 nobody submitted: average "—"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  await page.goto(T16(ex.id));
  await expect(page.getByLabel('Số liệu của lớp')).toContainText(/Điểm trung bình \(Đã nộp\)\s*—/);
  await evidence(page, 'TC-101');
});
