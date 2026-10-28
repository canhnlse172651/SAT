import { expect, test } from '@playwright/test';
import { MIN, T22, evidence, freshStudents, getExam, gvPage, holder, hvPage, newClass, scheduledExam, start, vnInput } from './helpers';

test('[006:AC-5.1] TC-034 with an attempt the close time can only move later', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 30, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  expect((await start(hv.page, ex.id, holder())).status).toBe(200);
  await page.goto(T22(ex.id));
  await page.getByLabel('Giờ đóng').fill(vnInput(new Date(ex.closesAtDate.getTime() - 30 * MIN)));
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByLabel('Giờ đóng')).toHaveAccessibleDescription(/Khi đã có học viên làm bài, chỉ có thể lùi giờ đóng muộn hơn\./);
  expect((await getExam(page, ex.id)).closesAt).toBe(ex.closesAtDate.toISOString());
  await evidence(page, 'TC-034');
});
