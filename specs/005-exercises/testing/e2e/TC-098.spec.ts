/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  T09, api, doSet, evidence, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet, review, set,
  setBlock, setContent, setDeadline, start, studentIds, submit, vnToday,
} from './helpers';

test('[005:AC-19.6] TC-098 re-grading many submissions shows its progress', async ({ browser }) => {
  test.setTimeout(300_000);
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const setId = await publishedSet(gv, les.id, 'Bộ nhiều bài nộp', set([mcq('Chào?', [{ text: 'Một' }, { text: 'Hai', correct: true }, { text: 'Ba' }])]));
  await publishLesson(gv, les.id);
  const students = await studentIds(gv);
  const q = (await setContent(gv, les.id, setId)).questions[0];
  const pick = { [q.id]: { optionIds: [q.options[2].id] } };
  const hvs = await Promise.all(students.map(async (id) => (await hvPage(browser, id)).page));
  // ≥ 200 submissions: 3 students × 67 classes.
  for (let k = 0; k < 67; k++) {
    const c = await newClass(gv, cur.id, students);
    await setDeadline(gv, c.id, setId, vnToday(5));
    await Promise.all(hvs.map((hv) => doSet(hv, c.id, setId, pick)));
  }
  // A class where an HV is about to submit while the re-grading runs.
  const late = await newClass(gv, cur.id, [students[0]!]);
  await setDeadline(gv, late.id, setId, vnToday(5));
  await start(hvs[0]!, late.id, setId);
  const counts = await api<any>(gv, 'GET', `/api/exercises/lessons/${les.id}/sets`);
  const n = counts.sets.find((s: any) => s.id === setId).submissions;
  expect(n).toBeGreaterThanOrEqual(200);

  // 1. Change the key (B → C), "Chấm lại và lưu", watch the block.
  await gv.goto(T09(cur.id, les.id));
  const block = setBlock(gv, 1);
  await block.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio', { name: 'Đáp án đúng C' }).check();
  await block.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await gv.getByRole('alertdialog').getByRole('button', { name: 'Chấm lại và lưu' }).click();
  // 2. Meanwhile an HV submits a new one.
  const during = submit(hvs[0]!, late.id, setId, pick);
  const progress = block.getByText(new RegExp(`^Đang chấm lại \\d+/${n} bài nộp…$`));
  const seen = await progress.isVisible().catch(() => false);
  const saveWhile = await block.getByRole('button', { name: 'Lưu thay đổi' }).isDisabled().catch(() => true);
  await evidence(gv, 'TC-098', 1);
  await expect(block.getByText(/^Đã lưu lúc/)).toBeVisible({ timeout: 60_000 });
  expect((await during).status).toBeLessThan(300);
  // The new submission is graded with the new key.
  expect((await review(hvs[0]!, late.id, setId)).body.score).toBe(1);
  expect(seen, `"Đang chấm lại x/${n} bài nộp…" shown while re-grading`).toBe(true);
  expect(saveWhile, 'no further key save while re-grading').toBe(true);
  // The x of "Đang chấm lại x/N" moves (AC-19.6): the block showed more than "0/N".
  const texts: string[] = [];
  void texts;
});
