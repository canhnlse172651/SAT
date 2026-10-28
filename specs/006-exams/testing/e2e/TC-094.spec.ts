import { expect, test } from '@playwright/test';
import { S07, answerE3, card, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-14.1] TC-094 the result right after submitting: score, points, times, one attempt', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-094 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await answerE3(p, { q1: 'Xin chào', q2: 'full', q3: '您好' });
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await p.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  const check = async () => {
    await expect(p.getByRole('heading', { name })).toBeVisible();
    await expect(p.getByText(/^Đã nộp lúc \d\d:\d\d \d\d\/\d\d\/\d{4}/)).toBeVisible();
    await expect(p.getByLabel('75/100')).toBeVisible();
    await expect(p.getByText('3 / 4 điểm')).toBeVisible();
    await expect(p.getByText(/^Thời gian làm bài: /)).toBeVisible();
    await expect(p.getByText('Bạn chỉ làm bài thi này một lần.')).toBeVisible();
    await expect(p.getByText('Nộp tự động')).toHaveCount(0);
  };
  await check();
  await evidence(p, 'TC-094', 1);
  await p.goto(S07);
  await card(p, name).getByRole('button', { name: 'Xem kết quả' }).click();
  await check();
  await evidence(p, 'TC-094', 2);
});
