import { expect, test } from '@playwright/test';
import {
  archiveExam, evidence, exam, examRow, expectSummary, gvPage, hvPage, myScore, newClass, openRankingTab, openS09, pastClose, people, r1,
  relogin, takeExam, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-4.9] [008:AC-11.10] TC-022 an archived exam keeps submitted points in "Bài thi đã gỡ", drops the no-show 0', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const { An, Dũng } = await people(gv, ['An', 'Dũng']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Dũng]);
  const X = await exam(gv, [A.id], { name: `TC-022 X ${Date.now()}` });
  const an = await hvPage(browser, An);
  const dung = await hvPage(browser, Dũng);
  await takeExam(gv, an.page, X.id, 'three');
  await pastClose(gv, X.closesAtDate);
  await relogin(gv, 'GV');

  // 1. GV archives X. 2. An and Dũng open "Điểm của tôi".
  await archiveExam(gv, X.id);
  await openS09(an.page);
  await myScore(an.page);
  await expect(examRow(an.page, X.name)).toHaveCount(0);
  const gone = an.page.getByRole('note').filter({ hasText: 'Bài thi đã gỡ' });
  await expect(gone).toHaveText('Bài thi đã gỡ: 1 bài thi · 75 điểm');
  await expect(gone.getByRole('link')).toHaveCount(0);
  await expectSummary(an.page, { avgExam: '75,0', nExam: 1 });
  await expect(an.page.getByText('Lớp chưa có bài thi nào.')).toBeVisible();
  await evidence(an.page, 'TC-022', 1);

  await openS09(dung.page);
  await myScore(dung.page);
  await expectSummary(dung.page, { avgExam: '0,0', nExam: 0 });
  await expect(examRow(dung.page, X.name)).toHaveCount(0);
  await expect(dung.page.getByRole('note').filter({ hasText: 'Bài thi đã gỡ' })).toHaveCount(0);
  await evidence(dung.page, 'TC-022', 2);

  // 3. GV expands An's row.
  await openRankingTab(gv, A.id);
  await gv.getByRole('button', { name: 'Chi tiết điểm của Nguyễn Văn An' }).click();
  const xRow = gv.locator('.rk-bk tr', { hasText: X.name });
  await expect(xRow).toContainText('Đã gỡ khỏi lớp');
  await evidence(gv, 'TC-022', 3);
});
