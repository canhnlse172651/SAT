import { expect, test } from '@playwright/test';
import { evidence, exam, examRow, expectSummary, gvPage, hvPage, myScore, newClass, openS09, pastClose, people, r1, refresh, startAndSaveExam, useClockReset, closeOpened } from './helpers';

test.afterEach(closeOpened);

useClockReset();

test('[008:AC-2.9] TC-013 the automatic submission at close time counts instead of 0', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  const X = await exam(gv, [A.id], { name: `TC-013 X ${Date.now()}` });
  const { page: hv } = await hvPage(browser, An);
  await startAndSaveExam(gv, hv, X.id);

  await pastClose(gv, X.closesAtDate);
  await openS09(hv);
  await myScore(hv);
  const x = examRow(hv, X.name);
  // 006 settles a closed exam within 10 s; "Làm mới" until then.
  await expect(async () => {
    await refresh(hv);
    await expect(x).toContainText('Đã có điểm', { timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  await expect(x).toContainText('3/4 · 75%');
  await expect(x.locator('.rk-row__pts')).toHaveText('75/100');
  await expect(x).not.toContainText('Không làm bài');
  await expectSummary(hv, { avgExam: '75,0' });
  await evidence(hv, 'TC-013', 1);
});
