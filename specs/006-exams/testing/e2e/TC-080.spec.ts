import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-11.4] TC-080 a submit lost offline keeps the work and offers "Thử lại"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-080 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await answerE3(p, { q1: 'Xin chào' });
  await expect(p.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  await hv.ctx.setOffline(true);
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await p.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(p.getByText('Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.')).toBeVisible();
  await expect(p.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: 'Câu 1 · đã hoàn thành' })).toBeVisible();
  await evidence(p, 'TC-080', 1);
  await hv.ctx.setOffline(false);
  await p.getByRole('button', { name: 'Thử lại' }).click();
  await expect(p.getByLabel('25/100')).toBeVisible();
  await evidence(p, 'TC-080', 2);
});
