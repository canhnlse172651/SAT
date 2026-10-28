import { expect, test } from '@playwright/test';
import {
  MIN, S07, S08, T10, advanceClock, contentOf, evidence, feed, freshStudents, gvPage, holder, hvPage, mcqAnswers, mcqs,
  newClass, resetClock, scheduledExam, start, submit, uid,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-6.3] TC-042 archiving a closed exam hides it from T10 and the HV, results kept for 008 / 009', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h] = await freshStudents(page, 1);
  const A = await newClass(page, [h!]);
  const name = `TC-042 ${uid()}`;
  const ex = await scheduledExam(page, { name, classIds: [A.id], content: mcqs(5), dur: 1, closeAfter: 1 });
  const hv = await hvPage(browser, h!);
  const k = holder();
  expect((await start(hv.page, ex.id, k)).status).toBe(200);
  const content = await contentOf(page, ex.id);
  const answers = mcqAnswers(content);
  delete answers[content.questions[4].id];
  expect((await submit(hv.page, ex.id, k, answers)).status).toBe(200);
  await advanceClock(page, 2 * MIN);

  await page.goto(T10);
  const row = page.locator('tr', { hasText: name });
  await row.getByRole('button', { name: `Thao tác khác · ${name}` }).click();
  await page.getByRole('menuitem', { name: 'Lưu trữ' }).click();
  await expect(row).toHaveCount(0);
  await evidence(page, 'TC-042', 1);

  await hv.page.goto(S07);
  await expect(hv.page.getByRole('heading', { name })).toHaveCount(0);
  await hv.page.goto(S08(ex.id));
  await expect(hv.page.getByText('Không tìm thấy nội dung')).toBeVisible();
  await evidence(hv.page, 'TC-042', 2);
  const rows = (await feed(page, A.id)).filter((r) => r.examId === ex.id);
  expect(rows).toEqual([expect.objectContaining({ studentId: h, kind: 'submitted', percent: 80, archived: true })]);
});
