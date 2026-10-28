import { expect, test } from '@playwright/test';
import { S07, T16, card, classResults, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-8.5] TC-062 "Bắt đầu làm bài" on two devices at once: one attempt, the earlier device loses it', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-062 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const d1 = await hvPage(browser, h!);
  const d2 = await hvPage(browser, h!);
  for (const d of [d1, d2]) {
    await d.page.goto(S07);
    await card(d.page, name).getByRole('button', { name: 'Vào thi' }).click();
    await expect(d.page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeVisible();
  }
  await Promise.all([
    d1.page.getByRole('button', { name: 'Bắt đầu làm bài' }).click(),
    d2.page.getByRole('button', { name: 'Bắt đầu làm bài' }).click(),
  ]);
  await expect(d1.page.getByRole('timer')).toBeVisible();
  await expect(d2.page.getByRole('timer')).toBeVisible();
  const rows = (await classResults(page, ex.id, A.id)).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].kind).toBe('doing');
  // One of the two devices holds the attempt; the other says so within the 5 s poll.
  const held = (p: typeof page) => p.getByText('Bài thi đang được làm ở thiết bị hoặc cửa sổ khác').count();
  await expect.poll(async () => (await held(d1.page)) + (await held(d2.page)), { timeout: 10_000 }).toBe(1);
  await evidence(d1.page, 'TC-062', 1);
  await evidence(d2.page, 'TC-062', 2);
  await page.goto(T16(ex.id));
  await expect(page.locator('tbody tr')).toHaveCount(1);
});
