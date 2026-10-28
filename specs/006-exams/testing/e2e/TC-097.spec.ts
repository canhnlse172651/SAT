import { expect, test } from '@playwright/test';
import { MIN, S07, advanceClock, card, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-14.4] TC-097 "Không làm bài": "Bạn đã không làm bài thi này." with 0/100, no question', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h2] = await freshStudents(page, 1);
  const A = await newClass(page, [h2!]);
  const name = `TC-097 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id], dur: 1, closeAfter: 1 });
  await advanceClock(page, MIN + 75_000);
  const hv = await hvPage(browser, h2!);
  await hv.page.goto(S07);
  await card(hv.page, name).getByRole('button', { name: 'Xem kết quả' }).click();
  await expect(hv.page.getByText('Bạn đã không làm bài thi này.')).toBeVisible();
  await expect(hv.page.getByText('0', { exact: true }).or(hv.page.locator('.xm-score'))).toContainText('0');
  await expect(hv.page.locator('.xm-score')).toHaveText('0/100');
  await expect(hv.page.getByText(/你好|Đáp án đúng|Giải thích/)).toHaveCount(0);
  await evidence(hv.page, 'TC-097');
});
