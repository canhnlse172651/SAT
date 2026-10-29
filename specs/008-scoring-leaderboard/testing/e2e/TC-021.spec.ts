import { expect, test } from '@playwright/test';
import {
  DAY, LESSONS, advanceClock, ddmmyyyy, deadline, evidence, expectSummary, gvPage, myScore, openS09, refresh, setRow, tc016Data,
  useClockReset, vnDay, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-4.8] TC-021 moving a passed Hạn nộp to the future removes the 0 until the new one passes', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc016Data(browser, gv);
  await openS09(d.dung);
  await myScore(d.dung);
  const s3b = setRow(d.dung, LESSONS[2], 'Luyện mẫu câu');
  await expect(s3b).toContainText('Quá hạn');

  // 1. Hạn nộp of S3b → tomorrow. 2. "Làm mới".
  const tomorrow = await vnDay(gv, 1);
  await deadline(gv, d.A.id, d.r.sets.S3b, 1);
  await refresh(d.dung);
  await expect(s3b).toContainText('Chưa làm');
  await expect(s3b).toContainText(`Hạn nộp ${ddmmyyyy(tomorrow)}`);
  await expectSummary(d.dung, { avgEx: '70,0' });
  await evidence(d.dung, 'TC-021', 1);

  // 3. +48 h; "Làm mới".
  await advanceClock(gv, 2 * DAY);
  await refresh(d.dung);
  await expect(s3b).toContainText('Quá hạn');
  await expect(s3b.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(d.dung, { avgEx: '46,7' });
  await evidence(d.dung, 'TC-021', 2);
});
