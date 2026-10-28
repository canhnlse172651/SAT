/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  S05, S06, S11, api, doSet, evidence, gvPage, hideSection, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson,
  publishedSet, saveAnswers, saveItem, set, setContent, setDeadline, start, studentIds, vnToday,
} from './helpers';

test('[005:AC-21.4] [005:AC-21.5] [005:AC-21.7] TC-104 hiding the Bài tập section in one class', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const x = await publishedSet(gv, les.id, 'Bộ X', set([q('X1'), q('X2')]));
  const y = await publishedSet(gv, les.id, 'Bộ Y', set([q('Y1')]));
  await publishLesson(gv, les.id);
  const [hv1, hv2] = await studentIds(gv);
  const A = await newClass(gv, cur.id, [hv1!]);
  const B = await newClass(gv, cur.id, [hv2!]);
  for (const c of [A, B]) for (const s of [x, y]) await setDeadline(gv, c.id, s, vnToday(5));
  const xc = await setContent(gv, les.id, x);
  const yc = await setContent(gv, les.id, y);
  const p1 = (await hvPage(browser, hv1!)).page;
  await start(p1, A.id, x);
  await saveAnswers(p1, A.id, x, { [xc.questions[0].id]: { optionIds: [xc.questions[0].options[0].id] } });
  await doSet(p1, A.id, y, { [yc.questions[0].id]: { optionIds: [yc.questions[0].options[0].id] } });
  const yScore = async () => (await api<any>(gv, 'GET', `/api/exercises/classes/${A.id}/sets/${y}/submissions`)).items[0].score;
  expect(await yScore()).toBe(1);

  // 1. Hide the Bài tập section of Bài 1 in class A.
  await hideSection(gv, A.id, les.id, true);
  // 2. HV of class A.
  await p1.goto(S11(A.id, les.id));
  await expect(p1.getByRole('heading', { name: 'Bài 1' })).toBeVisible();
  await expect(p1.getByText('Bộ X')).toHaveCount(0);
  await expect(p1.getByText('Bộ Y')).toHaveCount(0);
  await evidence(p1, 'TC-104', 1);
  await p1.goto(S05(A.id, x));
  await expect(p1.getByText('Không tìm thấy nội dung')).toBeVisible();
  await p1.goto(S06(A.id, y));
  await expect(p1.getByText('Không tìm thấy nội dung')).toBeVisible();
  // 3. HV of class B: as usual.
  const p2 = (await hvPage(browser, hv2!)).page;
  await p2.goto(`${S11(B.id, les.id)}?tab=bai-tap`);
  await expect(p2.getByText('Bộ X')).toBeVisible();
  await expect(p2.getByText('Bộ Y')).toBeVisible();
  // The recorded score is kept; a re-grading happens while hidden.
  expect(await yScore()).toBe(1);
  const edited = structuredClone(yc);
  edited.questions[0].options.forEach((o: any, k: number) => (o.correct = k === 1));
  expect((await saveItem(gv, les.id, y, 'Bộ Y', edited, { confirmRegrade: true })).status).toBe(200);
  // 4. Show it again.
  await hideSection(gv, A.id, les.id, false);
  await p1.goto(`${S11(A.id, les.id)}?tab=bai-tap`);
  await expect(p1.getByRole('link', { name: /Bộ X.*Đang làm/ })).toBeVisible();
  await expect(p1.getByRole('link', { name: /Bộ Y.*Đã hoàn thành/ })).toBeVisible();
  await p1.goto(S06(A.id, y));
  await expect(p1.getByText(/^Điểm đã được cập nhật ngày \d\d\/\d\d\/\d{4} do giáo viên sửa đáp án: 1(,0)? → 0(,0)?$/)).toBeVisible();
  await p1.goto(S05(A.id, x));
  await p1.getByRole('button', { name: 'Tiếp tục làm' }).click();
  await expect(p1.getByRole('radio', { name: /^A\s*Đúng/ })).toBeChecked();
  await evidence(p1, 'TC-104', 2);
});
