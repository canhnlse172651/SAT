import { expect, test } from '@playwright/test';
import {
  advanceClock, api, classResults, contentOf, e3Answers, freshStudents, gvPage, holder, hvPage, newClass, resetClock,
  save, scheduledExam, serverNow, start,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-12.1] TC-083 a locked account: the attempt is still submitted automatically', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 5, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const k = holder();
  const s = await start(hv.page, ex.id, k);
  const content = await contentOf(page, ex.id);
  expect((await save(hv.page, ex.id, k, e3Answers(content, { q2: null, q3: null }))).status).toBe(200);
  await api(page, 'POST', `/api/students/${h}/lock`);
  await advanceClock(page, Date.parse(s.body.endsAt) + 15_000 - (await serverNow(page)).getTime());
  const row = (await classResults(page, ex.id, A.id)).rows[0];
  expect(row.student.locked).toBe(true);
  expect(row.kind).toBe('submitted');
  expect(row.auto).toBe(true);
  expect(row.percent).toBe(25);
});
