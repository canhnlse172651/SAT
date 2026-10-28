import { expect, test } from '@playwright/test';
import { answerE3, endClass, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-12.4] TC-086 the class ends during the attempt: the HV goes on and submits', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-086 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await answerE3(p, { q1: 'Xin chào', q2: 'full' });
  await endClass(page, A.id);
  await answerE3(p, { q3: '你好' });
  await expect(p.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await p.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(p.getByLabel('100/100')).toBeVisible();
  await evidence(p, 'TC-086');
});
