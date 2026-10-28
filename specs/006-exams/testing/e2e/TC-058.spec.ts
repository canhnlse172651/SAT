import { expect, test } from '@playwright/test';
import { MIN, S07, advanceClock, card, clockOf, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-8.4] TC-058 "Bắt đầu làm bài" after the close: no attempt, S07 with the new state', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-058 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 30, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await card(hv.page, name).getByRole('button', { name: 'Vào thi' }).click();
  await expect(hv.page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeVisible();
  await advanceClock(page, 61 * MIN);
  await hv.page.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  await expect(hv.page).toHaveURL(new RegExp(`${S07}$`));
  await expect(card(hv.page, name).locator('.xm-row__state')).toHaveText('Đã đóng · Không làm bài');
  await expect(card(hv.page, name).getByRole('button', { name: 'Vào thi' })).toHaveCount(0);
  expect((await clockOf(hv.page, ex.id)).status).toBe('none');
  await evidence(hv.page, 'TC-058');
});
