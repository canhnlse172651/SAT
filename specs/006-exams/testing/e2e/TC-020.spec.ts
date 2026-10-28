import { expect, test } from '@playwright/test';
import { MIN, S07, T22, draftExam, e3, evidence, freshStudents, gvPage, hvPage, minuteOf, newClass, serverNow, uid, vnInput, vnTimeDate } from './helpers';

test('[006:AC-3.4] TC-020 "Lên lịch" schedules a ready draft and the HV sees it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const t = uid();
  const d = await draftExam(page, { name: `TC-020 ${t}`, content: e3(), classIds: [A.id] });
  const open = new Date(minuteOf(await serverNow(page)).getTime() + 24 * 60 * MIN);
  await page.goto(T22(d.id));
  await page.getByLabel('Giờ mở').fill(vnInput(open));
  await page.getByLabel('Thời lượng (phút)').fill('45');
  await page.getByLabel('Giờ đóng').fill(vnInput(new Date(open.getTime() + 120 * MIN)));
  await page.getByRole('button', { name: 'Lên lịch' }).click();
  await expect(page.getByText(`Đã lên lịch · mở lúc ${vnTimeDate(open)}`)).toBeVisible();
  await expect(page.locator('.xm-status')).toContainText('Đã lên lịch');
  await evidence(page, 'TC-020', 1);

  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await expect(hv.page.getByRole('heading', { name: `TC-020 ${t}` })).toBeVisible();
  await evidence(hv.page, 'TC-020', 2);
});
