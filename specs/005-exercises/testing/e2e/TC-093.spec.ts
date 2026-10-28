/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  T06, T21, api, evidence, gvPage, mcq, newClass, newCurriculum, newLesson, publishLesson, publishedSet, publishedStep, set,
  setDeadline, studentIds, vnToday,
} from './helpers';

test('[005:AC-18.6] TC-093 T21 shows the sets as the HV sees them, nothing recorded', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id, 'Bài xem trước');
  const step = await publishedStep(page, les.id, 'Bước chào');
  const q = (p: string) => mcq(p, [{ text: 'Đúng', correct: true }, { text: 'Sai' }]);
  const x = await publishedSet(page, les.id, 'Bộ X', set([q('X một'), q('X hai')], 'Hướng dẫn X', step));
  await publishedSet(page, les.id, 'Bộ Y', set([q('Y một')]));
  await publishLesson(page, les.id);
  const cls = await newClass(page, cur.id, await studentIds(page));
  await setDeadline(page, cls.id, x, vnToday(1));

  // 1. T06 → "Xem như học viên", tab Bài tập.
  await page.goto(T06(cur.id));
  await page.getByRole('button', { name: 'Xem như học viên: Bài xem trước' }).or(page.getByRole('link', { name: 'Xem như học viên: Bài xem trước' })).click();
  await expect(page).toHaveURL(new RegExp(`${T21(cur.id, les.id)}$`));
  await page.getByRole('tab', { name: /^Bài tập/ }).click();
  const X = page.getByRole('article', { name: 'Bộ X' });
  const Y = page.getByRole('article', { name: 'Bộ Y' });
  await expect(X.getByRole('heading', { name: 'Bộ X' })).toBeVisible();
  await expect(X.getByText('Hướng dẫn X')).toBeVisible();
  await expect(X.getByText('Luyện cho: Bước chào')).toBeVisible();
  await expect(X.getByText(/^2 câu · Tổng điểm 2$/)).toBeVisible();
  await expect(X.getByRole('heading', { name: 'Câu 1' })).toBeVisible();
  await expect(X.getByRole('heading', { name: 'Câu 2' })).toBeVisible();
  await expect(Y.getByText(/^1 câu · Tổng điểm 1$/)).toBeVisible();
  // Answers can be tried.
  await X.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio', { name: /^A\s*Đúng/ }).click();
  await expect(X.getByRole('region', { name: 'Câu 1', exact: true }).getByRole('radio', { name: /^A\s*Đúng/ })).toBeChecked();
  // No submit, deadline or status line.
  await expect(page.getByRole('button', { name: 'Nộp bài' })).toHaveCount(0);
  for (const t of [/Hạn nộp/, /Hạn hôm nay/, /Nộp muộn/, /Quá hạn/, /Chưa mở/]) await expect(page.getByText(t)).toHaveCount(0);
  await evidence(page, 'TC-093');
  // Nothing recorded.
  const counts = await api<any>(page, 'GET', `/api/exercises/lessons/${les.id}/sets`);
  expect(counts.sets.every((s: any) => s.submissions === 0)).toBe(true);
  const subs = await api<any>(page, 'GET', `/api/exercises/classes/${cls.id}/sets/${x}/submissions`);
  expect(subs.items).toHaveLength(0);
});
