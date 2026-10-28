import { expect, test } from '@playwright/test';
import { S07, api, card, evidence, freshStudents, getExam, gvPage, hvPage, newClass, scheduledExam, uid } from './helpers';

test('[006:AC-8.4] TC-060 the exam was unscheduled while the lobby was open: A05', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-060 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  await hv.page.goto(S07);
  await card(hv.page, name).getByRole('button', { name: 'Vào thi' }).click();
  await expect(hv.page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeVisible();
  await api(page, 'POST', `/api/exams/${ex.id}/unschedule`, { expectedVersion: (await getExam(page, ex.id)).version });
  await hv.page.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  await expect(hv.page.getByText('Không tìm thấy nội dung')).toBeVisible();
  expect((await getExam(page, ex.id)).attemptCount).toBe(0);
  await evidence(hv.page, 'TC-060');
});
