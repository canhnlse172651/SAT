import { expect, test } from '@playwright/test';
import {
  MIN, S08, advanceClock, doExam, evidence, freshStudents, gvPage, holder, hvPage, newClass, resetClock, scheduledExam,
  serverNow, start,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-14.3] TC-096 after the close with every attempt submitted: each question with answer, key and explanation', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!, h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 10, closeAfter: 30 });
  const hv1 = await hvPage(browser, h1!);
  await doExam(page, hv1.page, ex.id, { q1: true, q2: 'half', q3: null });
  await advanceClock(page, ex.closesAtDate.getTime() - 5 * MIN - (await serverNow(page)).getTime());
  const hv2 = await hvPage(browser, h2!);
  expect((await start(hv2.page, ex.id, holder())).status).toBe(200);
  await advanceClock(page, ex.closesAtDate.getTime() + 15_000 - (await serverNow(page)).getTime());
  const p = hv1.page;
  await p.goto(`${S08(ex.id)}?ket-qua=1`);
  await expect(p.getByRole('heading', { name: 'Từng câu · đáp án và giải thích' })).toBeVisible();
  const rows = p.locator('.ex-review__row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Câu 1');
  await expect(rows.nth(0)).toContainText('Đúng');
  await expect(rows.nth(0)).toContainText('1 / 1 điểm');
  await expect(rows.nth(0)).toContainText('Bạn trả lời:');
  await expect(rows.nth(0)).toContainText('Đáp án đúng:');
  await expect(rows.nth(0)).toContainText('Giải thích: 你好 = xin chào');
  await expect(rows.nth(1)).toContainText('Đúng một phần');
  await expect(rows.nth(2)).toContainText('Chưa trả lời');
  await evidence(p, 'TC-096');
});
