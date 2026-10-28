import { expect, test } from '@playwright/test';
import { classResults, freshStudents, gvPage, holder, hvPage, newClass, scheduledExam, start, submit } from './helpers';

test('[006:AC-11.3] TC-079 two submits at once: exactly one submission', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  const hv = await hvPage(browser, h!);
  const k = holder();
  expect((await start(hv.page, ex.id, k)).status).toBe(200);
  const [r1, r2] = await Promise.all([submit(hv.page, ex.id, k), submit(hv.page, ex.id, k)]);
  const statuses = [r1.status, r2.status].sort();
  expect(statuses[0]).toBe(200);
  expect([200, 409]).toContain(statuses[1]);
  const rows = (await classResults(page, ex.id, A.id)).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].kind).toBe('submitted');
});
