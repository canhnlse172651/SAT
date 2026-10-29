import { expect, test } from '@playwright/test';
import { LESSONS, deadline, evidence, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, realSubmit, regrade, setRow, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-3.2] TC-015 a re-grade changes each class only through its own submission', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv, { twoQ: ['S1a'] });
  const A = await newClass(gv, r.cur, [An], { name: `TC-015 Lớp A ${Date.now()}` });
  const B = await newClass(gv, r.cur, [An], { name: `TC-015 Lớp B ${Date.now()}` });
  await deadline(gv, A.id, r.sets.S1a);
  await deadline(gv, B.id, r.sets.S1a);
  const { page: hv } = await hvPage(browser, An);
  await realSubmit(hv, A.id, r.sets.S1a, r.content.S1a, [0, 0]);
  await realSubmit(hv, B.id, r.sets.S1a, r.content.S1a, [0, 1]);

  // 1. Key of question 2 → B, re-grade confirmed.
  await regrade(gv, r, 'S1a', 1, 1);
  // 2. S09 of class A, then class B.
  await openS09(hv, A.id);
  await myScore(hv);
  await expect(setRow(hv, LESSONS[0], 'Luyện từ mới')).toContainText('1/2 · 50%');
  await expectSummary(hv, { score: '15,0' });
  await evidence(hv, 'TC-015', 1);

  await openS09(hv, B.id);
  await myScore(hv);
  await expect(setRow(hv, LESSONS[0], 'Luyện từ mới')).toContainText('2/2 · 100%');
  await expectSummary(hv, { score: '30,0' });
  await evidence(hv, 'TC-015', 2);
});
