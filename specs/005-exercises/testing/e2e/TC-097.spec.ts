/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S06, T09, T14, api, doSet, endClass, evidence, gvPage, hideSection, hvPage, mcq, newClass, newCurriculum, newLesson,
  publishLesson, publishedSet, set, setBlock, setContent, setDeadline, studentIds, vnToday,
} from './helpers';

const NOTE = /^Điểm đã được cập nhật ngày \d\d\/\d\d\/\d{4} do giáo viên sửa đáp án: 1(,0)? → 0(,0)?$/;

test('[005:AC-19.4] [005:AC-19.5] TC-097 re-grading reaches every class', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const setId = await publishedSet(gv, les.id, 'Bộ mọi lớp', set([mcq('Chào?', [{ text: 'Một' }, { text: 'Hai', correct: true }, { text: 'Ba' }])]));
  await publishLesson(gv, les.id);
  const students = await studentIds(gv);
  const q = (await setContent(gv, les.id, setId)).questions[0];
  const A = await newClass(gv, cur.id, students);
  const B = await newClass(gv, cur.id, [students[0]!]);
  const C = await newClass(gv, cur.id, [students[0]!]);
  for (const c of [A, B, C]) await setDeadline(gv, c.id, setId, vnToday(5));
  const pick = { [q.id]: { optionIds: [q.options[1].id] } };
  for (const id of students) await doSet((await hvPage(browser, id)).page, A.id, setId, pick);
  const hv1 = (await hvPage(browser, students[0]!)).page;
  await doSet(hv1, B.id, setId, pick);
  await doSet(hv1, C.id, setId, pick);
  await hideSection(gv, B.id, les.id, true);
  await endClass(gv, C.id);

  // 1. Change the key, "Chấm lại và lưu".
  await gv.goto(T09(cur.id, les.id));
  const block = setBlock(gv, 1);
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio', { name: 'Đáp án đúng C' }).check();
  await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(gv.getByRole('alertdialog')).toContainText('Thay đổi này làm thay đổi điểm của 5 bài nộp. Chấm lại và lưu?');
  await gv.getByRole('alertdialog').getByRole('button', { name: 'Chấm lại và lưu' }).click();
  await expect(block.getByText(/^Đã lưu lúc/)).toBeVisible();
  // Every submission of the 3 classes re-graded (scores go down).
  for (const c of [A, B, C]) {
    const items = (await api<any>(gv, 'GET', `/api/exercises/classes/${c.id}/sets/${setId}/submissions`)).items;
    expect(items.map((i: any) => i.score), c.name).toEqual(items.map(() => 0));
  }
  // 2. HV S06 and GV T14 carry the note, the new result and key.
  await hv1.goto(S06(A.id, setId));
  await expect(hv1.getByText(NOTE)).toBeVisible();
  await expect(hv1.getByText('Sai', { exact: true })).toBeVisible();
  await expect(hv1.getByText('Đáp án đúng: C. Ba')).toBeVisible();
  await evidence(hv1, 'TC-097', 1);
  for (const c of [A, B, C]) {
    await gv.goto(T14(c.id, students[0]!, setId));
    await expect(gv.getByText(NOTE), c.name).toBeVisible();
    await expect(gv.getByText('Đáp án đúng: C. Ba')).toBeVisible();
  }
  await evidence(gv, 'TC-097', 2);
});
