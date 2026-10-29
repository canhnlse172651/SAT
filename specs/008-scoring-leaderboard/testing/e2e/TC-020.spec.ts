import { expect, test } from '@playwright/test';
import { LESSONS, deadline, evidence, expectSummary, gvPage, myScore, openS09, refresh, setRow, tc016Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-4.7] TC-020 removing a Hạn nộp keeps submissions and drops the overdue 0', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc016Data(browser, gv);
  await openS09(d.an);
  await myScore(d.an);
  await openS09(d.dung);
  await myScore(d.dung);

  // 1. GV removes the Hạn nộp of S3b. 2. "Làm mới".
  await deadline(gv, d.A.id, d.r.sets.S3b, null);
  await refresh(d.an);
  const a = setRow(d.an, LESSONS[2], 'Luyện mẫu câu');
  await expect(a).toContainText('Đã có điểm');
  await expect(a.locator('.rk-row__pts')).toHaveText('75/100');
  await expectSummary(d.an, { avgEx: '88,3' });
  await evidence(d.an, 'TC-020', 1);
  await refresh(d.dung);
  await expect(setRow(d.dung, LESSONS[2], 'Luyện mẫu câu')).toHaveCount(0);
  await expectSummary(d.dung, { avgEx: '70,0', score: '21,0' });
  await evidence(d.dung, 'TC-020', 2);
});
