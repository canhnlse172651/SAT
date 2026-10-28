import { expect, test } from '@playwright/test';
import { T22, call, evidence, freshStudents, getExam, gvPage, holder, hvPage, newClass, scheduledExam, start } from './helpers';

test('[006:AC-3.8] TC-026 no "Hủy lịch" once someone started; the API refuses it', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  expect((await start(hv.page, ex.id, holder())).status).toBe(200);

  await page.goto(T22(ex.id));
  await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy lịch' })).toHaveCount(0);
  const r = await call(page, 'POST', `/api/exams/${ex.id}/unschedule`, { expectedVersion: (await getExam(page, ex.id)).version });
  expect(r.status).toBe(409);
  expect((await getExam(page, ex.id)).state).toBe('open');
  await evidence(page, 'TC-026');
});
