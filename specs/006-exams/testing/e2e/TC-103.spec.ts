import { expect, test } from '@playwright/test';
import { T16, doExam, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-15.5] TC-103 "Xem bài nộp" opens the submission read-only on T14, before the close', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1, 'Trần Học Viên');
  const A = await newClass(page, [h!]);
  const name = `TC-103 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  await doExam(page, (await hvPage(browser, h!)).page, ex.id, { q3: false });
  await page.goto(T16(ex.id));
  await page.getByRole('link', { name: 'Xem bài nộp' }).click();
  await expect(page.getByRole('heading', { name: 'Xem bài nộp' })).toBeVisible();
  const facts = page.locator('dl');
  await expect(facts).toContainText('Trần Học Viên 1');
  await expect(facts).toContainText(A.name);
  await expect(facts).toContainText(name);
  await expect(facts).toContainText('Bắt đầu');
  await expect(facts).toContainText('Nộp lúc');
  await expect(facts).toContainText('Thời gian làm bài');
  await expect(facts).toContainText('75/100');
  await expect(facts).toContainText('3 / 4 điểm');
  await expect(page.locator('.ex-review__row')).toHaveCount(3);
  await expect(page.getByText('Đáp án đúng:').first()).toBeVisible();
  await expect(page.getByText('Giải thích: 你好 = xin chào')).toBeVisible();
  await expect(page.locator('main input, main textarea, main select')).toHaveCount(0);
  await evidence(page, 'TC-103');
});
