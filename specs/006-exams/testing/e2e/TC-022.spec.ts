import { expect, test } from '@playwright/test';
import { MIN, T22, draftExam, e3, evidence, freshStudents, getExam, gvPage, minuteOf, newClass, serverNow } from './helpers';

test('[006:AC-3.5] TC-022 an incomplete question and a past open time are listed; "Câu 2" leads to question 2', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const content = e3();
  (content.questions[1] as { pairs: { b: string }[] }).pairs[1]!.b = '';
  const now = minuteOf(await serverNow(page));
  const d = await draftExam(page, {
    content,
    classIds: [A.id],
    opensAt: new Date(now.getTime() - 60 * MIN),
    dur: 45,
    closesAt: new Date(now.getTime() + 120 * MIN),
  });
  await page.goto(T22(d.id));
  await page.getByRole('button', { name: 'Lên lịch' }).click();
  const box = page.getByRole('alert').filter({ hasText: 'điều kiện chưa đạt' });
  await expect(box.getByRole('button', { name: /^Câu 2: / })).toBeVisible();
  await expect(box.getByRole('button', { name: 'Giờ mở không được sớm hơn thời điểm hiện tại' })).toBeVisible();
  await box.getByRole('button', { name: /^Câu 2: / }).click();
  await expect(page.getByRole('region', { name: 'Câu 2' })).toBeInViewport();
  expect((await getExam(page, d.id)).state).toBe('draft');
  await evidence(page, 'TC-022');
});
