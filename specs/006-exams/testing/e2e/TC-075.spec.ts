import { expect, test } from '@playwright/test';
import { S08, answerE3, contentOf, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-10.4] TC-075 the device that opened last holds the attempt; the other cannot change answers', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-075 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const d1 = await hvPage(browser, h!);
  await startOnScreen(d1.page, name);
  const d2 = await hvPage(browser, h!);
  await d2.page.goto(S08(ex.id));
  await expect(d2.page.getByRole('timer')).toBeVisible();

  await expect(d1.page.getByText('Bài thi đang được làm ở thiết bị hoặc cửa sổ khác')).toBeVisible({ timeout: 8000 });
  await expect(d1.page.getByRole('button', { name: /Xin chào/ }).or(d1.page.getByRole('radio', { name: /Xin chào/ })).first()).toBeDisabled();
  await evidence(d1.page, 'TC-075', 1);
  await answerE3(d2.page, { q1: 'Xin chào' });
  await expect(d2.page.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  await evidence(d2.page, 'TC-075', 2);
  expect((await contentOf(page, ex.id)).questions).toHaveLength(3);
});
