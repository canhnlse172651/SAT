import { expect, test } from '@playwright/test';
import { answerE3, evidence, freshStudents, gvPage, hvPage, newClass, scheduledExam, startOnScreen, uid } from './helpers';

test('[006:AC-11.1] TC-077 the submit confirmation names unfinished questions', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-077 ${uid()}`;
  await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await answerE3(p, { q1: 'Xin chào' });
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  const dialog = p.getByRole('alertdialog');
  await expect(dialog).toContainText('2 câu chưa hoàn thành: 2, 3');
  await expect(dialog).toContainText('Sau khi nộp bạn không thể làm lại.');
  await expect(dialog.getByRole('button', { name: 'Nộp bài' })).toBeVisible();
  await evidence(p, 'TC-077', 1);
  await dialog.getByRole('button', { name: 'Làm tiếp' }).click();
  await expect(dialog).toHaveCount(0);
  await answerE3(p, { q2: 'full', q3: '你好' });
  await p.getByRole('button', { name: 'Nộp bài' }).click();
  await expect(p.getByRole('alertdialog')).toContainText('Bạn đã hoàn thành tất cả câu hỏi');
  await evidence(p, 'TC-077', 2);
});
