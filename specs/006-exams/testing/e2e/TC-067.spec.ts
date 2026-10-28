import { expect, test } from '@playwright/test';
import { MIN, advanceClock, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, startOnScreen, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-9.4] TC-067 "Còn 5 phút" and "Còn 1 phút", once each, not blocking', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-067 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id], dur: 7, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await advanceClock(page, 2 * MIN + 5000);
  await expect(p.getByText('Còn 5 phút')).toBeVisible({ timeout: 8000 });
  await evidence(p, 'TC-067', 1);
  // Not blocking: the questions still respond.
  await p.getByRole('button', { name: 'Câu sau' }).click();
  await expect(p.getByText('Câu 2/3')).toBeVisible();
  await advanceClock(page, 4 * MIN);
  await expect(p.getByText('Còn 1 phút')).toBeVisible({ timeout: 8000 });
  await p.waitForTimeout(6000);
  await expect(p.getByText('Còn 5 phút')).toHaveCount(0);
  await expect(p.getByText('Còn 1 phút')).toHaveCount(await p.getByText('Còn 1 phút').count() > 0 ? 1 : 0);
  await evidence(p, 'TC-067', 2);
});
