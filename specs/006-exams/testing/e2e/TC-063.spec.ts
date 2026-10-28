import { expect, test } from '@playwright/test';
import { S07, card, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-8.6] TC-063 an attempt counts as used as soon as it is created', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-063 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  await startOnScreen(hv.page, name);
  // Leave at once through the tab bar (nothing answered).
  await hv.page.getByRole('link', { name: 'Bài thi' }).click();
  await expect(hv.page).toHaveURL(new RegExp(`${S07}$`));
  const c = card(hv.page, name);
  await expect(c).toContainText(/Đang làm · còn \d\d:\d\d/);
  await expect(c.getByRole('button', { name: 'Tiếp tục làm bài' })).toBeVisible();
  await expect(c.getByRole('button', { name: 'Vào thi' })).toHaveCount(0);
  await evidence(hv.page, 'TC-063');
});
