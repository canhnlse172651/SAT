import { expect, test } from '@playwright/test';
import {
  DAY, archiveExam, archiveSet, advanceClock, deadline, evidence, exam, gvPage, hideExercises, openRankingTab, relogin, submitScore, takeExam,
  tc016Data, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-10.2] TC-050 the expanded row shows every item, labelled, "Không tính" where it does not count', async ({ browser }) => {
  test.setTimeout(180_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc016Data(browser, gv, { skipClock: true });
  await deadline(gv, d.A.id, d.r.sets.S2a);
  await submitScore(d.an, d.A.id, d.r.sets.S2a, 6, 10);
  const X = await exam(gv, [d.A.id], { name: `TC-050 X ${Date.now()}` });
  const Y = await exam(gv, [d.A.id], { name: `TC-050 Y ${Date.now()}`, closeAfter: 3 * 24 * 60 });
  await takeExam(gv, d.an, X.id, 'three');
  // TC-016 data: +24 h; then Bài 3 hidden, S2a archived, X (closed) archived; Y still open, An has not taken it.
  await advanceClock(gv, DAY);
  await relogin(gv, 'GV');
  await hideExercises(gv, d.A.id, d.r.lessons[2]!);
  await archiveSet(gv, d.r, 'S2a');
  await archiveExam(gv, X.id);

  // 1. "Chi tiết điểm của Nguyễn Văn An".
  await openRankingTab(gv, d.A.id);
  await gv.getByRole('button', { name: 'Chi tiết điểm của Nguyễn Văn An' }).click();
  const bk = gv.locator('.rk-bk');
  await expect(bk).toBeVisible();
  const item = (name: string) => bk.locator('tbody tr', { has: gv.locator('td', { hasText: name }) }).first();
  await expect(bk.locator('tr.sub-grp')).toContainText(['Bài 1 – 你好', 'Bài 2 – 谢谢', 'Bài 3 – 再见']);
  const bai3 = bk.locator('tr.sub-grp', { hasText: 'Bài 3 – 再见' });
  await expect(bai3).toBeVisible();
  const s3 = bk.locator('tbody tr').filter({ hasText: 'Đã ẩn trong lớp' });
  await expect(s3).toHaveCount(2);
  await expect(s3.nth(0)).toContainText('Luyện từ mới');
  await expect(s3.nth(1)).toContainText('Luyện mẫu câu');
  await expect(bk.locator('tbody tr').filter({ hasText: 'Đã lưu trữ' })).toHaveCount(1);
  await expect(bk.locator('tbody tr').filter({ hasText: 'Đã lưu trữ' })).toContainText('Luyện từ mới');
  await expect(item(X.name)).toContainText('Đã gỡ khỏi lớp');
  await expect(item(Y.name)).toContainText('Chưa thi');
  await expect(item(Y.name)).toContainText('Không tính');
  // Every item that does not count says "Không tính"; counted items show their points.
  const rows = bk.locator('tbody tr:not(.grp):not(.sub-grp)');
  for (let i = 0; i < (await rows.count()); i++) {
    const last = (await rows.nth(i).locator('td').last().innerText()).trim();
    expect(last === 'Không tính' || /^\d+\/100$/.test(last), `row ${i}: ${last}`).toBe(true);
  }
  await evidence(gv, 'TC-050', 1);

  // 2. "Xem hồ sơ học tập" → T15.
  await gv.getByRole('link', { name: /Xem hồ sơ học tập/ }).click();
  await expect(gv).toHaveURL(new RegExp(`/gv/hoc-vien/${d.An}$`));
  await evidence(gv, 'TC-050', 2);
});
