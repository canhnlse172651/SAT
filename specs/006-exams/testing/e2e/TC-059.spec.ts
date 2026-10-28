import { expect, test } from '@playwright/test';
import { S07, card, doExam, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-8.4] TC-059 an old tab still on the lobby after submitting: no new attempt, S07 shows "Đã nộp"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-059 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await card(hv.page, name).getByRole('button', { name: 'Vào thi' }).click();
  await expect(hv.page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeVisible();
  // Meanwhile the same HV took and submitted it in another tab.
  const other = await hv.ctx.newPage();
  await doExam(page, other, ex.id);
  await hv.page.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  // AC-8.4: S07 with the new state (the lobby itself lives on the S07 path).
  await expect(card(hv.page, name).locator('.xm-row__state')).toHaveText('Đã nộp · 100/100');
  await expect(hv.page).toHaveURL(new RegExp(`${S07}$`));
  await evidence(hv.page, 'TC-059');
});
