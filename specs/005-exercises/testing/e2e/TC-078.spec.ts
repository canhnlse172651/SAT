import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, evidence, gvPage, hvPage, mcq, review, saveAnswers, set, setContent } from './helpers';

test('[005:AC-15.3] TC-078 after submitting the answers are locked', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ khóa', content: set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]) }]);
  const setId = d.sets[0]!;
  const q = (await setContent(gv, d.les, setId)).questions[0];
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();

  // 1. Submit and confirm → S06 with the time.
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
  await expect(page.getByText(/^nộp lúc \d\d\/\d\d\/\d{4} \d\d:\d\d$/)).toBeVisible();
  await evidence(page, 'TC-078');
  const before = (await review(page, d.cls, setId)).body;
  // 2. Another answer through the API: refused, nothing changes.
  const r = await saveAnswers(page, d.cls, setId, { [q.id]: { optionIds: [q.options[1].id] } });
  expect(r.status).toBe(409);
  const after = (await review(page, d.cls, setId)).body;
  expect([after.score, after.rows[0].answer, after.submittedAt]).toEqual([before.score, before.rows[0].answer, before.submittedAt]);
});
