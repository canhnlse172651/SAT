import { expect, test } from '@playwright/test';
import { MIN, T22, draftExam, e3, evidence, freshStudents, getExam, gvPage, minuteOf, newClass, serverNow, vnInput } from './helpers';

test('[006:AC-3.3] TC-019 close-time rules on "Lên lịch", shown under Giờ đóng', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const d = await draftExam(page, { content: e3(), classIds: [A.id] });
  const open = new Date(minuteOf(await serverNow(page)).getTime() + 24 * 60 * MIN);
  await page.goto(T22(d.id));
  await page.getByLabel('Giờ mở').fill(vnInput(open));
  await page.getByLabel('Thời lượng (phút)').fill('45');
  await page.getByLabel('Giờ đóng').fill(vnInput(new Date(open.getTime() + 30 * MIN)));
  await page.getByRole('button', { name: 'Lên lịch' }).click();
  await expect(page.getByLabel('Giờ đóng')).toHaveAccessibleDescription(
    /Giờ đóng phải sau giờ mở ít nhất bằng thời lượng làm bài \(45 phút\)\./,
  );
  await evidence(page, 'TC-019', 1);

  await page.getByLabel('Giờ mở').fill(vnInput(new Date(open.getTime() - 48 * 60 * MIN)));
  await page.getByLabel('Giờ đóng').fill(vnInput(new Date(open.getTime() - 25 * 60 * MIN)));
  await page.getByRole('button', { name: 'Lên lịch' }).click();
  await expect(page.getByLabel('Giờ đóng')).toHaveAccessibleDescription(/Giờ đóng phải ở tương lai\./);
  expect((await getExam(page, d.id)).state).toBe('draft');
  await evidence(page, 'TC-019', 2);
});
