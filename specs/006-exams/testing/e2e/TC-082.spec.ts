import { expect, test } from '@playwright/test';
import {
  advanceClock, classResults, contentOf, e3Answers, freshStudents, gvPage, holder, hvPage, newClass, resetClock, save,
  scheduledExam, serverNow, start,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-12.1] TC-082 nobody connected: the attempt is submitted automatically at its end with the saved answers', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 5, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const k = holder();
  const s = await start(hv.page, ex.id, k);
  const content = await contentOf(page, ex.id);
  const a = e3Answers(content, { q3: null });
  expect((await save(hv.page, ex.id, k, a)).status).toBe(200);
  await hv.ctx.close();
  await advanceClock(page, Date.parse(s.body.endsAt) + 15_000 - (await serverNow(page)).getTime());
  const row = (await classResults(page, ex.id, A.id)).rows[0];
  expect(row.kind).toBe('submitted');
  expect(row.auto).toBe(true);
  expect(row.submittedAt).toBe(s.body.endsAt);
  expect(row.percent).toBe(75);
});
