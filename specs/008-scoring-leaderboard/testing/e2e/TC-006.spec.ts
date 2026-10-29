import { expect, test } from '@playwright/test';
import {
  DAY, LESSONS, advanceClock, ddmmyyyy, deadlines, evidence, exam, examRow, expectSummary, gvPage, hvPage, lessonGroup, myScore,
  newClass, openS09, people, r1, refresh, setRow, submitScore, useClockReset, vnDay, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-1.8] [008:AC-2.5] [008:AC-1.9] [008:AC-11.1] TC-006 an unsubmitted set counts 0 only once its Hạn nộp has passed', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S2b']);
  const today = await vnDay(gv);
  const Y = await exam(gv, [A.id], { name: `TC-006 Y ${Date.now()}`, closeAfter: 3 * 24 * 60 });

  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 18, 20);
  // 1. Before the Hạn nộp.
  await openS09(hv);
  await myScore(hv);
  const doc = setRow(hv, LESSONS[1], 'Đọc hiểu');
  await expect(doc).toContainText('Chưa làm');
  await expect(doc).toContainText(`Hạn nộp ${ddmmyyyy(today)}`);
  await expect(doc.locator('.rk-row__pts')).toHaveText('—');
  await expectSummary(hv, { avgEx: '90,0', nEx: 1 });
  await evidence(hv, 'TC-006', 1);
  // 2. +24 h, "Làm mới".
  await advanceClock(gv, DAY);
  await refresh(hv);
  await expect(doc).toContainText('Quá hạn');
  await expect(doc.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(hv, { avgEx: '45,0', nEx: 2, score: '13,5', avgExam: '0,0', nExam: 0 });
  await expect(lessonGroup(hv, LESSONS[2])).toHaveCount(0);
  await expect(lessonGroup(hv, LESSONS[3])).toHaveCount(0);
  await expect(examRow(hv, Y.name)).toContainText('Chưa thi');
  await evidence(hv, 'TC-006', 2);
});
