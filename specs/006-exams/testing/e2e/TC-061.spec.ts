import { expect, test } from '@playwright/test';
import { endClass, freshStudents, gvPage, holder, hvPage, learnView, newClass, scheduledExam, start } from './helpers';

test('[006:AC-8.4] TC-061 API refuses a start before the open time and when only an ended class is assigned', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const D = await newClass(page, [h!]);
  const early = await scheduledExam(page, { classIds: [A.id], openIn: 24 * 60 });
  const ended = await scheduledExam(page, { classIds: [D.id] });
  await endClass(page, D.id);
  const hv = await hvPage(browser, h!);
  for (const ex of [early, ended]) {
    const r = await start(hv.page, ex.id, holder());
    expect(r.status, JSON.stringify(r.body)).toBe(409);
    const v = await learnView(hv.page, ex.id);
    expect(v.status).toBe(200);
    expect(v.body.attempt).toBeNull();
  }
});
