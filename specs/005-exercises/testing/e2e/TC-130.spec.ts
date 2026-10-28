import { type Page, expect, test } from '@playwright/test';
import { S05, S06, api, classWithSets, evidence, gvPage, hvPage, mcq, removeStudent, set, studentIds, view } from './helpers';

const NOT_MEMBER = 'Bạn không thuộc lớp này hoặc lớp không còn tồn tại';

test('[005:AC-21.9] [005:NFR-9] TC-130 HV outside the class or removed from it', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const [hvA, hvB] = await studentIds(gv);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  // Class L (HV A only) with set X (deadline in 7 days).
  const d = await classWithSets(gv, [{ title: 'Bộ thành viên', content: set([q('Câu một?'), q('Câu hai?')]) }], {
    students: [hvA!],
  });
  const setId = d.sets[0]!;
  // HV A is doing X, question 1 saved; a second tab of the same attempt stays open.
  const { page: tabA, ctx } = await hvPage(browser, hvA!);
  await tabA.goto(S05(d.cls, setId));
  await tabA.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await tabA.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await expect(tabA.getByRole('status').filter({ hasText: /^Đã lưu$/ })).toBeVisible();
  const tabA2 = await ctx.newPage();
  await tabA2.goto(S05(d.cls, setId));
  await tabA2.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(tabA2.getByText('Câu một?')).toBeVisible();

  // Soft checks: every step is still executed and every deviation reported in one run.
  const refused = async (p: Page, step: string) => {
    await expect.soft(p.getByText(NOT_MEMBER), step).toBeVisible();
    await expect.soft(p, step).toHaveURL(/\/hv$/);
    await expect.soft(p, step).toHaveTitle(/Lớp của tôi/);
    await expect.soft(p.getByText('Bộ thành viên'), step).toHaveCount(0);
    await expect.soft(p.getByText('Câu một?'), step).toHaveCount(0);
    await expect.soft(p.getByText('Câu hai?'), step).toHaveCount(0);
  };

  // 1. HV B (not in L) opens S05, then S06 of X in L.
  const { page: b } = await hvPage(browser, hvB!);
  await b.goto(S05(d.cls, setId));
  await refused(b, '1 S05');
  await evidence(b, 'TC-130', 1);
  await b.goto(S06(d.cls, setId));
  await refused(b, '1 S06');
  await evidence(b, 'TC-130', 2);

  // 2. The GV removes HV A from L; HV A answers question 2, then presses "Nộp bài" (second tab).
  expect((await removeStudent(gv, d.cls, hvA!)).status).toBeLessThan(300);
  await tabA.getByRole('button', { name: 'Câu sau' }).click();
  await tabA.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await refused(tabA, '2 answer');
  await evidence(tabA, 'TC-130', 3);
  await tabA2.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await tabA2.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await refused(tabA2, '2 submit');
  await evidence(tabA2, 'TC-130', 4);

  // 3. HV A opens the S05 link of X again.
  await tabA.goto(S05(d.cls, setId));
  await refused(tabA, '3 S05 again');
  await evidence(tabA, 'TC-130', 5);

  // 4. The GV adds HV A back; HV A opens S05 → "Tiếp tục làm": question 1 keeps its saved answer, nothing was submitted.
  await api(gv, 'POST', `/api/classes/${d.cls}/students`, { studentIds: [hvA!] });
  const v = (await view(tabA, d.cls, setId)).body;
  expect(v.attempt?.submittedAt ?? null).toBeNull();
  expect(Object.keys(v.attempt?.answers ?? {})).toHaveLength(1);
  await tabA.goto(S05(d.cls, setId));
  await expect(tabA.getByRole('button', { name: 'Xem lại bài làm' })).toHaveCount(0);
  await tabA.getByRole('button', { name: 'Tiếp tục làm' }).click();
  if (await tabA.getByText('Câu hai?').isVisible()) await tabA.getByRole('button', { name: 'Câu trước' }).click();
  await expect(tabA.getByText('Câu một?')).toBeVisible();
  await expect(tabA.getByRole('radio', { name: /^A\s*Đúng/ })).toBeChecked();
  await evidence(tabA, 'TC-130', 6);
});
