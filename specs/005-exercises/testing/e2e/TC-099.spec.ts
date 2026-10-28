/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { expect, test } from '@playwright/test';
import {
  T04, b6, b6Answers, classWithSets, doSet, evidence, gvPage, hvPage, saveItem, setContent, setDeadline, vnToday,
} from './helpers';

test('[005:AC-20.1] [005:AC-20.2] [005:AC-20.3] TC-099 T04 → "Bài nộp" → T14 (read only)', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const d = await classWithSets(gv, [{ title: 'Bộ B6', content: b6(), deadline: vnToday(-1) }]);
  const setId = d.sets[0]!;
  const content = await setContent(gv, d.les, setId);
  const hvA = d.students[0]!;
  const { page: hv } = await hvPage(browser, hvA);
  await doSet(hv, d.cls, setId, b6Answers(content));
  // A re-grading note: Q1's key changes after the submission.
  const edited = structuredClone(content);
  edited.questions[0].options.forEach((o: any, k: number) => (o.correct = k === 2));
  expect((await saveItem(gv, d.les, setId, 'Bộ B6', edited, { confirmRegrade: true })).status).toBe(200);
  void setDeadline;

  // 1. T04 tab Nội dung, Bài tập column, "Bài nộp" of the set.
  await gv.goto(T04(d.cls));
  await gv.getByRole('tab', { name: /^Nội dung/ }).click();
  await gv.getByRole('button', { name: 'Bài nộp: Bộ B6' }).click();
  const drawer = gv.getByRole('dialog', { name: 'Bài nộp' });
  await expect(drawer.getByRole('columnheader', { name: 'Học viên' })).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: 'Nộp lúc' })).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: 'Điểm' })).toBeVisible();
  await expect(drawer.getByRole('row', { name: /Học viên Ba/ }).getByText('Nộp muộn')).toBeVisible();
  await evidence(gv, 'TC-099', 1);
  // 2. "Xem bài nộp" of HV A.
  await drawer.getByRole('link', { name: 'Xem bài nộp của Học viên Ba' }).click();
  const t14 = gv.locator('[data-screen="T14"]');
  await expect(t14.getByRole('heading', { name: 'Xem bài nộp' })).toBeVisible();
  for (const v of ['Học viên Ba', 'Bài 1', 'Bộ B6']) await expect(t14.getByRole('definition').filter({ hasText: v }).first()).toBeVisible();
  await expect(t14.getByRole('definition').filter({ hasText: /^\d\d\/\d\d\/\d{4} \d\d:\d\d$/ })).toBeVisible();
  await expect(t14.getByRole('definition').filter({ hasText: /^11(,0)? \/ 12(,0)? điểm \(92%\)$/ })).toBeVisible();
  await expect(t14.getByText('Nộp muộn', { exact: true })).toBeVisible();
  await expect(t14.getByText(/^Điểm đã được cập nhật ngày \d\d\/\d\d\/\d{4} do giáo viên sửa đáp án: 12(,0)? → 11(,0)?$/)).toBeVisible();
  const rows = t14.locator(':scope > ol.ex-review__rows > li.ex-review__row');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(0)).toContainText('Câu 1 · Trắc nghiệm');
  await expect(rows.nth(0)).toContainText('你好 nǐ hǎo là gì?');
  await expect(rows.nth(0)).toContainText('Câu trả lời: B. Xin chào');
  await expect(rows.nth(0)).toContainText('Đáp án đúng: C. Cảm ơn');
  await expect(rows.nth(0)).toContainText('Giải thích: 你好 = xin chào.');
  await expect(rows.nth(0).locator('.chip').first()).toHaveText('Sai');
  // No attempt count, best score, other attempts; nothing editable, no grading control.
  for (const t of [/lượt/i, /Cao nhất/, /Lượt khác/]) await expect(t14.getByText(t)).toHaveCount(0);
  await expect(t14.getByRole('textbox')).toHaveCount(0);
  await expect(t14.getByRole('button')).toHaveCount(0);
  await expect(t14.getByRole('radio')).toHaveCount(0);
  await expect(t14.getByRole('checkbox')).toHaveCount(0);
  await evidence(gv, 'TC-099', 2);
});
