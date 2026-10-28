/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import { T09, doSet, evidence, getLesson, gvPage, hvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet, set, setBlock, setContent, setDeadline, studentIds, vnToday } from './helpers';

test('[005:AC-22.1] [005:AC-22.2] TC-107 deleting a set', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id);
  const q = () => set([mcq('Câu?', [{ text: 'Đúng', correct: true }, { text: 'Sai' }])]);
  const a = await publishedSet(gv, les.id, 'A', q());
  const b = await publishedSet(gv, les.id, 'B', q());
  await publishLesson(gv, les.id);
  const students = await studentIds(gv);
  const cls = await newClass(gv, cur.id, students);
  await setDeadline(gv, cls.id, b, vnToday(5));
  const bq = (await setContent(gv, les.id, b)).questions[0];
  for (const id of students) await doSet((await hvPage(browser, id)).page, cls.id, b, { [bq.id]: { optionIds: [bq.options[0].id] } });
  await gv.goto(T09(cur.id, les.id));

  // 1. "Xóa" on A, confirm.
  await setBlock(gv, 1).getByRole('button', { name: 'Xóa', exact: true }).click();
  const dialog = gv.getByRole('alertdialog');
  await expect(dialog).toContainText('Xóa “A”?');
  await expect(dialog).toContainText('Thao tác có hiệu lực ngay và không hoàn tác được.');
  await evidence(gv, 'TC-107', 1);
  await dialog.getByRole('button', { name: 'Xóa' }).click();
  await expect(gv.getByText('Đã xóa · Đã lưu')).toBeVisible();
  expect((await getLesson(gv, les.id)).items.some((i: any) => i.id === a)).toBe(false);
  await expect(gv.getByRole('textbox', { name: 'Tiêu đề', exact: true })).toHaveCount(1);
  // 2. "Xóa" on B.
  await setBlock(gv, 1).getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(gv.getByText('Bộ bài tập đã có dữ liệu học tập nên không xóa được — hãy Lưu trữ.')).toBeVisible();
  await expect(gv.getByRole('alertdialog')).toHaveCount(0);
  expect((await getLesson(gv, les.id)).items.some((i: any) => i.id === b)).toBe(true);
  await evidence(gv, 'TC-107', 2);
});
