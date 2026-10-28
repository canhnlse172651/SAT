import { expect, test } from '@playwright/test';
import { S07, T22, card, evidence, freshStudents, getExam, gvPage, holder, hvPage, newClass, scheduledExam, start, startOnScreen, uid } from './helpers';

test('[006:AC-5.3] TC-037 a class added to a running exam can take it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h3] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const B = await newClass(page, [h3!]);
  const name = `TC-037 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const hv1 = await hvPage(browser, h1!);
  expect((await start(hv1.page, ex.id, holder())).status).toBe(200);

  await page.goto(T22(ex.id));
  await page.getByRole('button', { name: 'Chọn lớp…' }).click();
  await page.getByRole('group', { name: 'Chọn lớp được giao' }).getByText(B.name).click();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(async () => (await getExam(page, ex.id)).classIds.length).toBe(2);

  const hv3 = await hvPage(browser, h3!);
  await hv3.page.goto(S07);
  await expect(card(hv3.page, name)).toContainText('Đang mở · đóng lúc');
  await startOnScreen(hv3.page, name);
  await expect(hv3.page.getByText('Câu 1/3')).toBeVisible();
  await evidence(hv3.page, 'TC-037');
});
