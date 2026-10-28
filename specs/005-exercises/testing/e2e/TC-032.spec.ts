/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, doSet, evidence, gvPage, hvPage, mcq, review, set, setContent } from './helpers';

test('[005:AC-4.6] [005:AC-4.8] TC-032 multi-answer question: all correct, nothing more', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [
    {
      title: 'Bộ nhiều đáp án',
      content: set([
        mcq('Chọn các lời chào', [
          { text: '你好', correct: true },
          { text: '谢谢' },
          { text: '您好', correct: true },
          { text: '再见' },
        ], { multi: true }),
      ]),
    },
  ]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const id = (t: string) => q.options.find((o: any) => o.text === t).id;
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();

  // 1. The hint, no count of correct answers.
  await expect(page.getByText('Chọn tất cả đáp án đúng')).toBeVisible();
  await expect(page.getByText(/\b2 đáp án\b|có 2 đáp án|\(2\)/)).toHaveCount(0);
  // 2. A, C, D, then D off with the keyboard.
  const box = (l: string) => page.getByRole('checkbox', { name: new RegExp(`^${l}\\s`) });
  await box('A').click();
  await box('C').click();
  await box('D').click();
  await expect(box('D')).toBeChecked();
  await box('D').focus();
  await page.keyboard.press('Space');
  await expect(box('D')).not.toBeChecked();
  await expect(box('A')).toBeChecked();
  await expect(box('C')).toBeChecked();
  await evidence(page, 'TC-032', 1);
  // 3. Submit {A, C}: full points.
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  const r = (await review(page, d.cls, setId)).body.rows[0];
  expect([r.earned, r.max]).toEqual([1, 1]);
  await evidence(page, 'TC-032', 2);
  // Others: {A} → 0, {A, C, D} → 0.
  const { page: hv2 } = await hvPage(browser, d.students[1]!);
  await doSet(hv2, d.cls, setId, { [q.id]: { optionIds: [id('你好')] } });
  expect((await review(hv2, d.cls, setId)).body.rows[0].earned).toBe(0);
  const { page: hv3 } = await hvPage(browser, d.students[2]!);
  await doSet(hv3, d.cls, setId, { [q.id]: { optionIds: [id('你好'), id('您好'), id('再见')] } });
  expect((await review(hv3, d.cls, setId)).body.rows[0].earned).toBe(0);
});
