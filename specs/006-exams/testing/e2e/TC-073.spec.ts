import { expect, test } from '@playwright/test';
import {
  S07, answerE3, card, clockOf, evidence, freshStudents, goTo, gvPage, hvPage, newClass, scheduledExam, startOnScreen,
  timerSeconds, uid,
} from './helpers';

test('[006:AC-10.3] TC-073 another device continues the same attempt where the HV left it', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-073 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const d1 = await hvPage(browser, h!);
  await startOnScreen(d1.page, name);
  await answerE3(d1.page, { q1: 'Xin chào', q2: 'full' });
  await goTo(d1.page, 2);
  await expect(d1.page.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  await d1.ctx.close();

  const d2 = await hvPage(browser, h!, { viewport: { width: 412, height: 915 } });
  await d2.page.goto(S07);
  await card(d2.page, name).getByRole('button', { name: 'Tiếp tục làm bài' }).click();
  const board = d2.page.getByRole('navigation', { name: 'Bảng số câu' });
  await expect(board.getByRole('button', { name: 'Câu 1 · đã hoàn thành' })).toBeVisible();
  await expect(board.getByRole('button', { name: 'Câu 2 · đã hoàn thành' })).toBeVisible();
  await expect(d2.page.getByText('Câu 2/3')).toBeVisible();
  const c = await clockOf(d2.page, ex.id);
  const expected = (Date.parse(c.endsAt) - Date.parse(c.serverNow)) / 1000;
  expect(Math.abs((await timerSeconds(d2.page)) - expected)).toBeLessThanOrEqual(3);
  await evidence(d2.page, 'TC-073');
});
