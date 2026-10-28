import { expect, test } from '@playwright/test';
import { T22, draftExam, evidence, getExam, gvPage, mcq } from './helpers';

test('[006:AC-2.3] TC-009 field rules: name, duration, invalid question field — not saved, error under the field', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const d = await draftExam(page, {
    content: { instructions: '', stepId: null, questions: [mcq('Câu?', [{ text: 'A', correct: true }, { text: 'B' }])] },
  });
  const v0 = (await getExam(page, d.id)).version;
  await page.goto(T22(d.id));

  await page.getByLabel('Tên bài thi').fill('');
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText('Tên bài thi bắt buộc, tối đa 150 ký tự')).toBeVisible();
  await page.getByLabel('Tên bài thi').fill('x'.repeat(151));
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText('Tên bài thi bắt buộc, tối đa 150 ký tự')).toBeVisible();
  await page.getByLabel('Tên bài thi').fill('TC-009');
  for (const v of ['0', '301', '1,5']) {
    await page.getByLabel('Thời lượng (phút)').fill(v);
    await page.getByRole('button', { name: 'Lưu nháp' }).click();
    await expect(page.getByText('Thời lượng phải là số nguyên từ 1 đến 300 phút')).toBeVisible();
  }
  await page.getByLabel('Thời lượng (phút)').fill('45');
  // A "trường chưa hợp lệ" of 005 AC-2.6: points 0,3 (not 0,5–100 in steps of 0,5). The test case names duplicate options,
  // but 005 classes those as "chưa hoàn chỉnh" (a draft may hold them) — see the run report.
  const q = page.getByRole('region', { name: 'Câu 1' });
  await q.getByLabel('Điểm').fill('0,3');
  await q.getByLabel('Điểm').blur();
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(q.getByText('Điểm phải từ 0,5 đến 100 và theo bước 0,5')).toBeVisible();
  expect((await getExam(page, d.id)).version).toBe(v0);
  await evidence(page, 'TC-009');
});
