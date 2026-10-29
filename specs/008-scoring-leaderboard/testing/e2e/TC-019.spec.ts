import { expect, test } from '@playwright/test';
import { LESSONS, archiveSet, evidence, expectSummary, gvPage, myScore, openS09, refresh, setRow, tc016Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-4.6] [008:AC-11.3] TC-019 an archived set keeps submitted points, an overdue 0 is dropped', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc016Data(browser, gv);
  const line = (p: typeof d.an) => p.getByRole('note').filter({ hasText: 'Nội dung đã ẩn' });
  await openS09(d.an);
  await myScore(d.an);
  await openS09(d.dung);
  await myScore(d.dung);

  // 1. GV archives S3b. 2. "Làm mới".
  await archiveSet(gv, d.r, 'S3b');
  await refresh(d.an);
  await expectSummary(d.an, { avgEx: '88,3' });
  await expect(line(d.an)).toHaveText('Nội dung đã ẩn: 1 bộ bài tập · 75 điểm');
  await expect(setRow(d.an, LESSONS[2], 'Luyện mẫu câu')).toHaveCount(0);
  await evidence(d.an, 'TC-019', 1);
  await refresh(d.dung);
  await expectSummary(d.dung, { avgEx: '70,0' });
  await expect(setRow(d.dung, LESSONS[2], 'Luyện mẫu câu')).toHaveCount(0);
  await expect(line(d.dung)).toHaveCount(0);
  await evidence(d.dung, 'TC-019', 2);

  // 3. GV restores S3b; "Làm mới".
  await archiveSet(gv, d.r, 'S3b', true);
  await refresh(d.an);
  await expect(setRow(d.an, LESSONS[2], 'Luyện mẫu câu').locator('.rk-row__pts')).toHaveText('75/100');
  await expect(line(d.an)).toHaveCount(0);
  await expectSummary(d.an, { avgEx: '88,3' });
  await refresh(d.dung);
  const s3b = setRow(d.dung, LESSONS[2], 'Luyện mẫu câu');
  await expect(s3b).toContainText('Quá hạn');
  await expect(s3b.locator('.rk-row__pts')).toHaveText('0/100');
  await expectSummary(d.dung, { avgEx: '46,7' });
  await evidence(d.dung, 'TC-019', 3);
});
