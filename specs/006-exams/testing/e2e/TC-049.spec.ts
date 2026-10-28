import { expect, test } from '@playwright/test';
import {
  MIN, S07, addToClass, advanceClock, card, doExam, endClass, evidence, freshStudents, gvPage, holder, hvPage, newClass,
  resetClock, scheduledExam, start, uid, vnTimeDate,
} from './helpers';

test.afterEach(async ({ browser }) => {
  await resetClock((await gvPage(browser)).page);
});

test('[006:AC-7.3] TC-049 the seven HV states of S07 with their buttons', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page } = await gvPage(browser);
  const [h1, other] = await freshStudents(page, 2);
  const A = await newClass(page, [h1!]);
  const D = await newClass(page, [h1!]);
  const E = await newClass(page, [other!]);
  const t = uid();
  const n = (s: string) => `TC-049 ${s} ${t}`;
  const hv = await hvPage(browser, h1!);

  const ex1 = await scheduledExam(page, { name: n('1 nộp'), classIds: [A.id], dur: 45, closeAfter: 120 });
  await doExam(page, hv.page, ex1.id, { q3: false }); // 3 / 4 = 75
  const ex2 = await scheduledExam(page, { name: n('2 làm'), classIds: [A.id], dur: 45, closeAfter: 120 });
  expect((await start(hv.page, ex2.id, holder())).status).toBe(200);
  await scheduledExam(page, { name: n('3 không làm'), classIds: [A.id], dur: 1, closeAfter: 1 });
  await scheduledExam(page, { name: n('4 vào sau'), classIds: [E.id], dur: 1, closeAfter: 1 });
  const ex5 = await scheduledExam(page, { name: n('5 chưa mở'), classIds: [A.id], openIn: 24 * 60, dur: 45, closeAfter: 60 });
  await scheduledExam(page, { name: n('6 lớp kết thúc'), classIds: [D.id], dur: 45, closeAfter: 120 });
  const ex7 = await scheduledExam(page, { name: n('7 mở'), classIds: [A.id], dur: 45, closeAfter: 120 });
  await endClass(page, D.id);
  await advanceClock(page, 2 * MIN + 15_000);
  // The close of exams 3 / 4 is processed on the next read; the HV joins class E only after that.
  await page.request.get('/api/exams');
  await addToClass(page, E.id, [h1!]);

  await hv.page.goto(S07);
  const expectRow = async (s: string, line: string | RegExp, button: string | null) => {
    const c = card(hv.page, n(s));
    await expect(c).toContainText(line);
    if (button) await expect(c.getByRole('button', { name: button })).toBeVisible();
    else await expect(c.getByRole('button')).toHaveCount(0);
  };
  await expectRow('1 nộp', 'Đã nộp · 75/100', 'Xem kết quả');
  await expectRow('2 làm', /Đang làm · còn \d\d:\d\d/, 'Tiếp tục làm bài');
  await expectRow('3 không làm', 'Đã đóng · Không làm bài', 'Xem kết quả');
  await expect(card(hv.page, n('4 vào sau')).locator('.xm-row__state')).toHaveText('Đã đóng');
  await expectRow('4 vào sau', 'Đã đóng', null);
  await expectRow('5 chưa mở', `Mở lúc ${vnTimeDate(ex5.opensAtDate)}`, null);
  await expectRow('6 lớp kết thúc', 'Lớp đã kết thúc — không thể vào thi.', null);
  await expectRow('7 mở', `Đang mở · đóng lúc ${vnTimeDate(ex7.closesAtDate)}`, 'Vào thi');
  await evidence(hv.page, 'TC-049');
});
