import { expect, test } from '@playwright/test';
import { addToClass, evidence, exam, examRow, expectSummary, gvPage, hvPage, myScore, newClass, openS09, people, r1, takeExam, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.12] [008:AC-2.7] TC-009 one exam submission counts in every class it was assigned to', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An, Bình } = await people(gv, ['An', 'Bình']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An, Bình], { name: `TC-009 Lớp A ${Date.now()}` });
  const B = await newClass(gv, r.cur, [Bình], { name: `TC-009 Lớp B ${Date.now()}` });
  const X = await exam(gv, [A.id, B.id], { name: `TC-009 X ${Date.now()}` });

  const binh = await hvPage(browser, Bình);
  await takeExam(gv, binh.page, X.id, 'three');
  for (const [k, cls] of [A, B].entries()) {
    await openS09(binh.page, cls.id);
    await expect(binh.page.getByRole('combobox', { name: 'Chọn lớp' })).toHaveValue(cls.id);
    await myScore(binh.page);
    const x = examRow(binh.page, X.name);
    await expect(x).toContainText('Đã có điểm');
    await expect(x.locator('.rk-row__pts')).toHaveText('75/100');
    await expectSummary(binh.page, { avgExam: '75,0', score: '52,5' });
    await evidence(binh.page, 'TC-009', k + 1);
  }

  const an = await hvPage(browser, An);
  await takeExam(gv, an.page, X.id, 'one');
  await addToClass(gv, B.id, [An]);
  await openS09(an.page, B.id);
  await expect(an.page.getByRole('combobox', { name: 'Chọn lớp' })).toHaveValue(B.id);
  await myScore(an.page);
  const x = examRow(an.page, X.name);
  await expect(x).toContainText('Đã có điểm');
  await expect(x).toContainText('1/4 · 25%');
  await expectSummary(an.page, { avgExam: '25,0', nExam: 1 });
  await evidence(an.page, 'TC-009', 3);
});
