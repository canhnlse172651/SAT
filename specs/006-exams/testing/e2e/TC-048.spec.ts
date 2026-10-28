import { expect, test } from '@playwright/test';
import { S07, card, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-7.2] TC-048 one S07 row per exam even for an HV in two assigned classes', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h2] = await freshStudents(page, 1);
  const t = uid();
  const A = await newClass(page, [h2!], { name: `Lớp A ${t}` });
  const B = await newClass(page, [h2!], { name: `Lớp B ${t}` });
  const name = `TC-048 ${t}`;
  await scheduledExam(page, { name, classIds: [A.id, B.id], dur: 45, closeAfter: 60 });
  const hv = await hvPage(browser, h2!);
  await page.goto('/gv'); // the GV page is not used further
  await hv.page.goto('/hv');
  await hv.page.getByRole('link', { name: 'Bài thi' }).click();
  await expect(hv.page).toHaveURL(new RegExp(`${S07}$`));
  await expect(hv.page.getByRole('heading', { name })).toHaveCount(1);
  const c = card(hv.page, name);
  await expect(c).toContainText(`Lớp A ${t}, Lớp B ${t}`);
  await expect(c).toContainText('3 câu hỏi');
  await expect(c).toContainText('45 phút');
  await expect(c).toContainText('Đang mở · đóng lúc');
  await expect(c.getByRole('button', { name: 'Vào thi' })).toBeVisible();
  await evidence(hv.page, 'TC-048');
});
