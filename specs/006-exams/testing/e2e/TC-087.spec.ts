/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  advanceClock, answerE3, api, clockOf, evidence, freshStudents, goTo, gvPage, hvPage, newClass, removeFromClass, resetClock,
  scheduledExam, serverNow, startOnScreen, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-12.5] TC-087 removed from every assigned class during the attempt: no more answers, auto-submitted', async ({ browser }) => {
  test.setTimeout(60_000);
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-087 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], dur: 5, closeAfter: 60 });
  const hv = await hvPage(browser, h!);
  const p = hv.page;
  await startOnScreen(p, name);
  await answerE3(p, { q1: 'Xin chào' });
  await expect(p.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 5000 });
  expect((await removeFromClass(page, A.id, h!)).status).toBeLessThan(300);
  await expect(
    p.getByText('Bạn không còn thuộc lớp được giao bài thi này. Câu trả lời đã lưu sẽ được nộp tự động khi hết giờ.'),
  ).toBeVisible({ timeout: 8000 });
  // No more answers: the answer fields are locked.
  await goTo(p, 3);
  await expect(p.getByRole('textbox')).not.toBeEditable();
  await evidence(p, 'TC-087');
  const endsAt = Date.parse((await clockOf(p, ex.id)).endsAt);
  await advanceClock(page, endsAt + 15_000 - (await serverNow(page)).getTime());
  await page.request.get('/api/exams');
  const sub = await api<any>(page, 'GET', `/api/exams/${ex.id}/submissions/${h}?classId=${A.id}`);
  expect(sub.auto).toBe(true);
  expect(sub.rows.map((r: any) => r.verdict)).toEqual(['correct', 'unanswered', 'unanswered']);
});
