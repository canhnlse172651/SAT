import { expect, test } from '@playwright/test';
import {
  MIN, addToClass, advanceClock, api, feed, freshStudents, gvPage, holder, hvPage, newClass, resetClock, scheduledExam,
  start,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-13.5] TC-092 results for 008 / 009 within 60 s of the close, with every field; membership and archive followed', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2, h9] = await freshStudents(page, 3);
  const A = await newClass(page, [h1!, h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 1, closeAfter: 1 });
  const hv1 = await hvPage(browser, h1!);
  expect((await start(hv1.page, ex.id, holder())).status).toBe(200); // never submits → automatic
  await advanceClock(page, MIN + 15_000 + MIN);
  const t0 = Date.now();
  const rows = (await feed(page, A.id)).filter((r) => r.examId === ex.id);
  expect(Date.now() - t0).toBeLessThan(60_000);
  const by = Object.fromEntries(rows.map((r) => [r.studentId, r]));
  expect(by[h1!]).toEqual({
    examId: ex.id,
    classId: A.id,
    studentId: h1,
    kind: 'submitted',
    percent: 0,
    submittedAt: expect.any(String),
    auto: true,
    closesAt: ex.closesAtDate.toISOString(),
    archived: false,
  });
  expect(by[h2!]).toMatchObject({ kind: 'noShow', percent: 0, submittedAt: null, auto: false, archived: false });
  await addToClass(page, A.id, [h9!]);
  expect((await feed(page, A.id)).filter((r) => r.examId === ex.id && r.studentId === h9)).toEqual([]);
  await api(page, 'POST', `/api/exams/${ex.id}/archive`);
  const archived = (await feed(page, A.id)).filter((r) => r.examId === ex.id);
  expect(archived).toHaveLength(2);
  expect(archived.every((r) => r.archived)).toBe(true);
});
