/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S05, S06, classWithSets, evidence, gvPage, hvPage, mcq, saveAnswers, set, setContent, start } from './helpers';

test('[005:AC-15.1] TC-076 the submit confirmation lists unfinished questions', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const qs = Array.from({ length: 10 }, (_, k) => mcq(`Câu số ${k + 1}`, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]));
  const d = await classWithSets(gv, [{ title: 'Bộ 10 câu', content: set(qs) }]);
  const setId = d.sets[0]!;
  const saved = (await setContent(gv, d.les, setId)).questions;
  const { page } = await hvPage(browser, d.students[0]!);
  // 7 answered.
  await start(page, d.cls, setId);
  await saveAnswers(page, d.cls, setId, Object.fromEntries(saved.slice(0, 7).map((q: any) => [q.id, { optionIds: [q.options[0].id] }])), 0);
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Tiếp tục làm' }).click();

  // 1. "Nộp bài".
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('3 câu chưa hoàn thành: 8, 9, 10');
  await expect(dialog.getByRole('button', { name: 'Nộp bài' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Làm tiếp' })).toBeVisible();
  await evidence(page, 'TC-076', 1);
  // 2. "Làm tiếp".
  await dialog.getByRole('button', { name: 'Làm tiếp' }).click();
  await expect(dialog).toHaveCount(0);
  // 3. Answer the rest, "Nộp bài".
  for (const n of [8, 9, 10]) {
    await page.getByRole('navigation', { name: 'Bảng câu hỏi' }).getByRole('button', { name: new RegExp(`^Câu ${n} · `) }).click();
    await page.getByRole('radio', { name: /^A\s*Đúng/ }).click();
  }
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Bạn đã hoàn thành tất cả câu hỏi');
  await evidence(page, 'TC-076', 2);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page).toHaveURL(new RegExp(`${S06(d.cls, setId)}$`));
});
