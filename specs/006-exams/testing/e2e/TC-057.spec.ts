import { expect, test } from '@playwright/test';
import { T16, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, timerSeconds, uid } from './helpers';

test('[006:AC-8.3] TC-057 "Bắt đầu làm bài" opens S08 at question 1 with the full duration', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-057 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 45, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  await startOnScreen(hv.page, name);
  await expect(hv.page.getByText('Câu 1/3')).toBeVisible();
  const a = await timerSeconds(hv.page);
  expect(a).toBeLessThanOrEqual(45 * 60);
  expect(a).toBeGreaterThan(45 * 60 - 10);
  await hv.page.waitForTimeout(1500);
  expect(await timerSeconds(hv.page)).toBeLessThan(a);
  await evidence(hv.page, 'TC-057', 1);

  await page.goto(T16(ex.id));
  await expect(page.locator('tr', { hasText: 'Đang làm' })).toContainText(/Bắt đầu \d\d:\d\d/);
  await evidence(page, 'TC-057', 2);
});
