import { expect, test } from '@playwright/test';
import { S07, card, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, serverNow, uid } from './helpers';

test('[006:AC-7.6] TC-052 at the open and close times the S07 row changes within 5 s, no reload', async ({ browser }) => {
  test.setTimeout(240_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-052 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], openIn: 1, dur: 1, closeAfter: 1 });
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  const c = card(hv.page, name);
  await expect(c).toContainText('Mở lúc');
  const skew = (await serverNow(page)).getTime() - Date.now();
  const until = (d: Date) => d.getTime() - skew - Date.now();

  await expect(c.getByRole('button', { name: 'Vào thi' })).toBeVisible({ timeout: until(ex.opensAtDate) + 5000 });
  await expect(c).toContainText('Đang mở · đóng lúc');
  await evidence(hv.page, 'TC-052', 1);
  await expect(c.getByRole('button', { name: 'Vào thi' })).toHaveCount(0, { timeout: until(ex.closesAtDate) + 5000 });
  await expect(c.locator('.xm-row__state')).toHaveText(/^Đã đóng( · Không làm bài)?$/);
  await evidence(hv.page, 'TC-052', 2);
});
