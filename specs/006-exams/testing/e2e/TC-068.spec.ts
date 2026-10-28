import { expect, test } from '@playwright/test';
import { MIN, advanceClock, evidence, freshStudents, gvPage, hvPage, newClass, resetClock, scheduledExam, startOnScreen, uid } from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-9.4] TC-068 started with 3 minutes left: no "Còn 5 phút", only "Còn 1 phút"', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-068 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 45, closeAfter: 60 });
  await advanceClock(page, ex.closesAtDate.getTime() - 3 * MIN - Date.now());
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await p.waitForTimeout(3000);
  await expect(p.getByText('Còn 5 phút')).toHaveCount(0);
  await advanceClock(page, 2 * MIN + 5000);
  await expect(p.getByText('Còn 1 phút')).toBeVisible({ timeout: 8000 });
  await expect(p.getByText('Còn 5 phút')).toHaveCount(0);
  await evidence(p, 'TC-068');
});
