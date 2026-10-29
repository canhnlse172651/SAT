import { expect, test } from '@playwright/test';
import { evidence, exam, examRow, expectSummary, gvPage, hvPage, myScore, newClass, openS09, pastClose, people, r1, takeExam, useClockReset, vnDateTime, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-2.8] [008:AC-11.8] TC-007 an exam not taken counts 0 after its close time', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình]);
  const X = await exam(gv, [A.id], { name: `TC-007 X ${Date.now()}` });
  const an = await hvPage(browser, An);
  const binh = await hvPage(browser, Bình);
  await takeExam(gv, binh.page, X.id, 'three');

  await pastClose(gv, X.closesAtDate);
  await openS09(an.page);
  await myScore(an.page);
  const x = examRow(an.page, X.name);
  const close = vnDateTime(X.closesAtDate); // dd/MM/yyyy HH:mm
  await expect(x).toContainText(`Đóng ${close.slice(11)} ${close.slice(0, 10)}`);
  await expect(x).toContainText('Không làm bài');
  await expect(x.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(an.page, { avgExam: '0,0', nExam: 1 });
  await evidence(an.page, 'TC-007', 1);

  await openS09(binh.page);
  await myScore(binh.page);
  const bx = examRow(binh.page, X.name);
  await expect(bx).toContainText('Đã có điểm');
  await expect(bx).toContainText('3/4 · 75%');
  await expect(bx.locator('.rk-row__pts')).toHaveText('75/100');
  await evidence(binh.page, 'TC-007', 2);
});
