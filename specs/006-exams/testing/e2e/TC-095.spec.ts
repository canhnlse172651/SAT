import { expect, test } from '@playwright/test';
import {
  MIN, S08, advanceClock, doExam, evidence, freshStudents, gvPage, holder, hvPage, newClass, resetClock, scheduledExam,
  serverNow, start, vnTimeDate,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-14.2] TC-095 no key before the close and while an attempt is still running', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [h1, h2] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!, h2!]);
  const ex = await scheduledExam(page, { classIds: [A.id], dur: 10, closeAfter: 30 });
  const hv1 = await hvPage(browser, h1!);
  await doExam(page, hv1.page, ex.id);
  const msg = `Đáp án và giải thích sẽ hiển thị sau khi bài thi đóng lúc ${vnTimeDate(ex.closesAtDate)}.`;
  await hv1.page.goto(`${S08(ex.id)}?ket-qua=1`);
  await expect(hv1.page.getByText(msg)).toBeVisible();
  await expect(hv1.page.getByText(/Đáp án đúng|Giải thích:/)).toHaveCount(0);
  await evidence(hv1.page, 'TC-095', 1);
  // hv2 starts 5 min before the close (its attempt ends at the close); then the clock reaches the close (+ 2 s).
  await advanceClock(page, ex.closesAtDate.getTime() - 5 * MIN - (await serverNow(page)).getTime());
  const hv2 = await hvPage(browser, h2!);
  expect((await start(hv2.page, ex.id, holder())).status).toBe(200);
  await advanceClock(page, ex.closesAtDate.getTime() + 2000 - (await serverNow(page)).getTime());
  await hv1.page.reload();
  await expect(hv1.page.getByText(msg)).toBeVisible();
  await expect(hv1.page.getByText(/Đáp án đúng|Giải thích:|Từng câu/)).toHaveCount(0);
  await evidence(hv1.page, 'TC-095', 2);
});
