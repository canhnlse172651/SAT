import { expect, test } from '@playwright/test';
import { T14, T16, T22, call, doExam, evidence, freshStudents, gvPage, hvPage, newClass, otherGvPage, scheduledExam } from './helpers';

test('[006:AC-16.1] [006:NFR-7] TC-106 another workspace\'s GV gets A05 / 404 for an exam, its results and submissions', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const ex = await scheduledExam(page, { classIds: [A.id] });
  await doExam(page, (await hvPage(browser, h!)).page, ex.id);
  const other = await otherGvPage(browser);
  const p = other.page;
  for (const url of [T22(ex.id), T16(ex.id), T14(ex.id, A.id, h!)]) {
    await p.goto(url);
    await expect(p.getByText('Không tìm thấy nội dung')).toBeVisible();
  }
  await evidence(p, 'TC-106');
  const missing = '64b7f0c2a1b2c3d4e5f60718';
  for (const [m, path] of [
    ['GET', `/api/exams/${ex.id}`],
    ['GET', `/api/exams/${ex.id}/results?classId=${A.id}`],
    ['GET', `/api/exams/${ex.id}/submissions/${h}?classId=${A.id}`],
    ['PUT', `/api/exams/${ex.id}`],
    ['DELETE', `/api/exams/${ex.id}`],
    ['GET', `/api/exams/${missing}`],
  ] as const) {
    const r = await call(p, m, path, m === 'PUT' ? { expectedVersion: 1, name: 'x', content: {}, classIds: [] } : undefined);
    expect(r.status, `${m} ${path}`).toBe(404);
    expect(r.body.error.message).toBe('Không tìm thấy nội dung bạn yêu cầu.');
  }
});
