/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { classResults, contentOf, freshStudents, gvPage, holder, hvPage, mcq, newClass, scheduledExam, start, submit } from './helpers';

test('[006:AC-13.2] TC-089 exam score = earned ÷ max × 100, rounded half up', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const [ha, hb] = await freshStudents(page, 2);
  const A = await newClass(page, [ha!, hb!]);
  const q = (pts: number) => mcq('你好?', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }], { points: pts });
  // 1 + 1 + 1 + 1 + 1 + 0.5 + 2.5 = 8 points.
  const content = { instructions: '', stepId: null, questions: [q(1), q(1), q(1), q(1), q(1), q(0.5), q(2.5)] };
  const ex = await scheduledExam(page, { classIds: [A.id], content });
  const stored = await contentOf(page, ex.id);
  const right = (k: number) => ({ optionIds: [stored.questions[k].options[0].id] });
  for (const [h, ks] of [[ha!, [0, 1, 2, 3, 4, 5]], [hb!, [0]]] as const) {
    const hv = await hvPage(browser, h);
    const k = holder();
    expect((await start(hv.page, ex.id, k)).status).toBe(200);
    const answers = Object.fromEntries(ks.map((i) => [stored.questions[i].id, right(i)]));
    expect((await submit(hv.page, ex.id, k, answers)).status).toBe(200);
  }
  const rows = (await classResults(page, ex.id, A.id)).rows;
  const pct = Object.fromEntries(rows.map((r: any) => [r.student.id, r.percent]));
  expect(pct[ha!]).toBe(69); // 5.5 / 8 = 68.75 %
  expect(pct[hb!]).toBe(13); // 1 / 8 = 12.5 %
});
