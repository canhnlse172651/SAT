import { expect, test } from '@playwright/test';
import { LESSONS, deadline, evidence, expectSummary, gvPage, hideExercises, hvPage, myScore, newClass, openS09, people, r1, refresh, setRow, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-4.4] TC-018 hiding in one class does not touch another class', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An], { name: `TC-018 Lớp A ${Date.now()}` });
  const B = await newClass(gv, r.cur, [An], { name: `TC-018 Lớp B ${Date.now()}` });
  await deadline(gv, A.id, r.sets.S3a);
  await deadline(gv, B.id, r.sets.S3a);
  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S3a, 10, 10);
  await submitScore(hv, B.id, r.sets.S3a, 10, 10);

  const checkB = async (n: number) => {
    const row = setRow(hv, LESSONS[2], 'Luyện từ mới');
    await expect(row).toContainText('Đã có điểm');
    await expect(row.locator('.rk-row__pts')).toHaveText('100/100');
    await expect(hv.getByRole('note').filter({ hasText: 'Nội dung đã ẩn' })).toHaveCount(0);
    await expectSummary(hv, { avgEx: '100,0', score: '30,0' });
    await evidence(hv, 'TC-018', n);
  };
  // 1. Hide Bài 3 in A. 2. An opens S09 class B.
  await hideExercises(gv, A.id, r.lessons[2]!);
  await openS09(hv, B.id);
  await myScore(hv);
  await checkB(1);
  // Hide then show again in A: B unchanged.
  await hideExercises(gv, A.id, r.lessons[2]!, false);
  await refresh(hv);
  await checkB(2);
});
