import { expect, test } from '@playwright/test';
import { S08, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-11.2] TC-078 submitting with nothing answered: 0/100, then nothing can be changed', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-078 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await p.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(p.getByLabel('0/100')).toBeVisible();
  await expect(p.getByText(/^Thời gian làm bài: /)).toBeVisible();
  await evidence(p, 'TC-078');
  await p.goto(S08(ex.id));
  await expect(p.getByLabel('0/100')).toBeVisible();
  await expect(p.getByRole('timer')).toHaveCount(0);
  await expect(p.getByRole('button', { name: 'Nộp bài' })).toHaveCount(0);
});
