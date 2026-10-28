/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, saveAnswers, saveItem, set, setContent, start, view, write } from './helpers';

test('[005:AC-18.4] TC-091 the set changed during an attempt', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const d = await classWithSets(gv, [{ title: 'Bộ đổi', content: set([q('Một'), q('Hai'), q('Ba')]) }]);
  const setId = d.sets[0]!;
  const content = await setContent(gv, d.les, setId);
  const [q1, q2, q3] = content.questions;
  const { page } = await hvPage(browser, d.students[0]!);
  await start(page, d.cls, setId);
  await saveAnswers(page, d.cls, setId, Object.fromEntries([q1, q2, q3].map((x: any) => [x.id, { optionIds: [x.options[0].id] }])));

  // 1. The GV deletes Q2 and replaces Q3 by a new question, saves.
  const r = await saveItem(gv, d.les, setId, 'Bộ đổi', { ...content, questions: [q1, write('Câu mới', 'nǐ', ['你'])] });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  // 2. The HV continues.
  await page.goto(S05(d.cls, setId));
  await page.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(page.getByText('Bộ bài tập vừa được giáo viên cập nhật. Hãy kiểm tra lại câu trả lời.')).toBeVisible();
  await expect(page.getByText('Câu 1/2')).toBeVisible();
  await expect(page.getByRole('radio', { name: /^A\s*Đúng/ })).toBeChecked();
  await expect(page.getByRole('navigation', { name: 'Bảng câu hỏi' }).getByRole('button', { name: 'Câu 2 · chưa trả lời' })).toBeVisible();
  await evidence(page, 'TC-091');
  const v = (await view(page, d.cls, setId)).body.attempt;
  expect(Object.keys(v.answers).filter((k) => Object.keys(v.answers[k]).length)).toEqual([q1.id]);
});
