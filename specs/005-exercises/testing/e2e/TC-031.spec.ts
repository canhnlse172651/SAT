/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, doSet, evidence, gvPage, hvPage, mcq, review, set, setContent } from './helpers';

test('[005:AC-4.5] [005:AC-4.7] TC-031 one-answer question: tap, keyboard, grading', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ một đáp án',
      content: set([
        mcq('你好 là gì?', [{ text: 'Tạm biệt' }, { text: 'Xin chào', correct: true }, { text: 'Cảm ơn' }]),
        mcq('Câu phụ', [{ text: 'Đúng', correct: true }, { text: 'Sai' }]),
      ]),
    },
  ]);
  const setId = d.sets[0]!;
  const c = await setContent(gv, d.les, setId);
  const [q1, q2] = c.questions;
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  const A = page.getByRole('radio', { name: /^A\s*Tạm biệt/ });
  const B = page.getByRole('radio', { name: /^B\s*Xin chào/ });
  const C = page.getByRole('radio', { name: /^C\s*Cảm ơn/ });

  // 1. Tap A then B: only B.
  await A.click();
  await B.click();
  await expect(B).toBeChecked();
  await expect(A).not.toBeChecked();
  // 2. Keyboard: Tab, arrows, Space → C.
  await page.getByRole('heading', { name: 'Câu 1' }).click();
  await A.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(C).toBeChecked();
  await expect(B).not.toBeChecked();
  await evidence(page, 'TC-031', 1);
  // 3. Choose B, submit: full points.
  await B.click();
  await page.getByRole('button', { name: 'Câu sau' }).click();
  await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  const r1 = (await review(page, d.cls, setId)).body.rows[0];
  expect([r1.earned, r1.max, r1.verdict]).toEqual([1, 1, 'correct']);
  await evidence(page, 'TC-031', 2);
  // Other submissions: A → 0; left empty → 0.
  const pick = (q: any, text: string) => q.options.find((o: any) => o.text === text).id;
  const { page: hv2 } = await hvPage(browser, d.students[1]!);
  await doSet(hv2, d.cls, setId, { [q1.id]: { optionIds: [pick(q1, 'Tạm biệt')] } });
  expect((await review(hv2, d.cls, setId)).body.rows[0].earned).toBe(0);
  const { page: hv3 } = await hvPage(browser, d.students[2]!);
  await doSet(hv3, d.cls, setId, { [q2.id]: { optionIds: [pick(q2, 'Đúng')] } });
  const r3 = (await review(hv3, d.cls, setId)).body.rows[0];
  expect([r3.earned, r3.verdict]).toEqual([0, 'unanswered']);
});
