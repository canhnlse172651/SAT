/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S05, S06, S11, aiApprove, draftSet, doSet, evidence, getLesson, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson,
  publishLesson, publishedSet, publishedStep, set, setContent, setDeadline, studentIds, vnToday,
} from './helpers';

test('[005:AC-13.1] [005:AC-13.8] [005:AC-13.10] TC-061 approving AI sets replaces the section', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const step = await publishedStep(gv, les.id, 'Bước có sẵn');
  const q = (p = 'Câu?') => mcq(p, [{ text: 'A', correct: true }, { text: 'B' }]);
  const a = await draftSet(gv, les.id, 'Bộ A', set([q()]));
  const b = await publishedSet(gv, les.id, 'Bộ B', set([q()]));
  const c = await publishedSet(gv, les.id, 'Bộ C', set([q()]));
  await publishLesson(gv, les.id);
  const students = await studentIds(gv);
  const cls = await newClass(gv, cur.id, students);
  await setDeadline(gv, cls.id, c, vnToday(5));
  const cq = (await setContent(gv, les.id, c)).questions[0];
  for (const id of students) {
    const { page: hv } = await hvPage(browser, id);
    await doSet(hv, cls.id, c, { [cq.id]: { optionIds: [cq.options[0].id] } });
  }

  // 1. Preview, then approve 2 valid sets (one linked to an existing step, one to a step that does not exist).
  const r = await aiApprove(gv, les.id, [
    { title: 'AI một', content: set([q('AI 1.1'), q('AI 1.2')], '', step) },
    { title: 'AI hai', content: set([q('AI 2.1')], '', 'ffffffffffffffffffffffff') },
  ]);
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  // 2. Read the Bài.
  const sets = (await getLesson(gv, les.id)).items.filter((i: any) => i.section === 'exercise');
  expect(sets.map((i: any) => [i.title, i.status])).toEqual([
    ['AI một', 'published'],
    ['AI hai', 'published'],
    ['Bộ C', 'archived'],
  ]);
  for (const s of sets.slice(0, 2)) {
    expect(s.ai).toBe(true);
    expect(s.content.questions.every((x: any) => x.ai === true)).toBe(true);
  }
  expect(sets[0].content.stepId).toBe(step);
  expect(sets[1].content.stepId).toBeNull();
  expect(sets.some((i: any) => i.id === a || i.id === b)).toBe(false);

  // 3. The HV sees the 2 new sets ("Chưa mở"), never "AI tạo".
  const { page: hv } = await hvPage(browser, students[0]!);
  await hv.goto(S11(cls.id, les.id));
  await hv.getByRole('tab', { name: /^Bài tập/ }).click();
  await expect(hv.getByRole('group', { name: 'AI một — Chưa mở' })).toBeVisible();
  await expect(hv.getByRole('group', { name: 'AI hai — Chưa mở' })).toBeVisible();
  await expect(hv.getByText('AI tạo')).toHaveCount(0);
  await evidence(hv, 'TC-061', 1);
  await setDeadline(gv, cls.id, sets[0].id, vnToday(5));
  await hv.goto(S05(cls.id, sets[0].id));
  await hv.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await expect(hv.getByText('AI 1.1')).toBeVisible();
  await expect(hv.getByText('AI tạo')).toHaveCount(0);
  const n = sets[0].content.questions;
  await doSet(hv, cls.id, sets[0].id, { [n[0].id]: { optionIds: [n[0].options[0].id] } });
  await hv.goto(S06(cls.id, sets[0].id));
  await expect(hv.getByText('Từng câu · đáp án và giải thích')).toBeVisible();
  await expect(hv.getByText('AI tạo')).toHaveCount(0);
  await evidence(hv, 'TC-061', 2);
});
