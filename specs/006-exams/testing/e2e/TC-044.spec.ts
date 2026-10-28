import { expect, test } from '@playwright/test';
import {
  MIN, S07, T10, advanceClock, api, card, contentOf, evidence, freshStudents, gvPage, holder, hvPage, mcqAnswers, mcqs,
  newClass, resetClock, scheduledExam, start, submit, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-6.5] TC-044 "Khôi phục" brings an archived exam back to Đã đóng with its results', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-044 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], content: mcqs(5), dur: 1, closeAfter: 1 });
  const hv = await hvPage(browser, h!);
  const k = holder();
  expect((await start(hv.page, ex.id, k)).status).toBe(200);
  const content = await contentOf(page, ex.id);
  const answers = mcqAnswers(content);
  delete answers[content.questions[4].id];
  expect((await submit(hv.page, ex.id, k, answers)).status).toBe(200);
  await advanceClock(page, 2 * MIN);
  await api(page, 'POST', `/api/exams/${ex.id}/archive`);

  await page.goto(T10);
  await page.getByRole('switch', { name: /^Hiện bài thi lưu trữ/ }).click();
  const row = page.locator('tr', { hasText: name });
  await row.scrollIntoViewIfNeeded();
  await row.getByRole('button', { name: `Thao tác khác · ${name}` }).click();
  const restore = page.getByRole('menuitem', { name: 'Khôi phục' });
  await restore.scrollIntoViewIfNeeded();
  await restore.click({ timeout: 10_000 });
  await expect(row).toContainText('Đã đóng');
  await evidence(page, 'TC-044', 1);

  await hv.page.goto(S07);
  await expect(card(hv.page, name)).toContainText('Đã nộp · 80/100');
  await card(hv.page, name).getByRole('button', { name: 'Xem kết quả' }).click();
  await expect(hv.page.getByLabel('80/100')).toBeVisible();
  await evidence(hv.page, 'TC-044', 2);
});
