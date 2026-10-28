import { expect, test } from '@playwright/test';
import { MIN, clockOf, freshStudents, gvPage, holder, hvPage, newClass, saveExam, scheduledExam, start } from './helpers';

test('[006:AC-5.2] TC-036 an attempt ending at start + duration keeps its end when the close moves later', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 15, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const s = await start(hv.page, ex.id, holder());
  expect(s.status).toBe(200);
  expect(Date.parse(s.body.endsAt) - Date.parse(s.body.startedAt)).toBe(15 * MIN);
  const r = await saveExam(page, ex.id, { closesAt: new Date(ex.closesAtDate.getTime() + 30 * MIN).toISOString() });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  expect((await clockOf(hv.page, ex.id)).endsAt).toBe(s.body.endsAt);
});
