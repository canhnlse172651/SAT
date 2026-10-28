import { expect, test } from '@playwright/test';
import { MIN, S07, addToClass, advanceClock, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-14.5] TC-098 joined after the close: "Bài thi đã đóng." without score, question or key', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h5] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const name = `TC-098 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, MIN + 75_000);
  await page.request.get('/api/exams');
  await addToClass(page, A.id, [h5!]);
  const hv = await hvPage(browser, h5!);
  await hv.page.goto(S07);
  await hv.page.getByRole('link', { name }).click();
  await expect(hv.page.getByText('Bài thi đã đóng.')).toBeVisible();
  await expect(hv.page.locator('.xm-score')).toHaveCount(0);
  await expect(hv.page.getByText(/你好|Đáp án đúng|Giải thích|\/100/)).toHaveCount(0);
  await evidence(hv.page, 'TC-098');
});
