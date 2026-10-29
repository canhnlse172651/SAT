import { expect, test } from '@playwright/test';
import {
  LESSONS, api, deadlines, evidence, exam, examRow, gvPage, hvPage, lessonGroup, myScore, newClass, openRankingTab, openS09, people, r1,
  submitScore, takeExam, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-11.5] TC-054 Hanzi, pinyin and Vietnamese names are shown exactly', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadlines(gv, A.id, r, ['S1a', 'S1b', 'S2a', 'S4a']);
  const X = await exam(gv, [A.id], { name: 'Kiểm tra 你好 nǐ hǎo' });
  const { page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 18, 20);
  await submitScore(hv, A.id, r.sets.S1b, 7, 10);
  await submitScore(hv, A.id, r.sets.S2a, 2, 3);
  await takeExam(gv, hv, X.id, 'three');
  const me = await api(gv, 'GET', `/api/students/${An}`);
  await api(gv, 'PATCH', `/api/students/${An}`, { displayName: 'Nguyễn Văn Ân', email: me.email });

  // 1. "Điểm của tôi".
  await openS09(hv);
  await myScore(hv);
  await expect(lessonGroup(hv, LESSONS[0]).locator('.rk-bai')).toHaveText('Bài 1 – 你好');
  await expect(lessonGroup(hv, LESSONS[3]).locator('.rk-bai')).toHaveText('Bài 4 – 学习 xuéxí');
  await expect(examRow(hv, 'Kiểm tra 你好 nǐ hǎo').locator('.rk-row__title')).toHaveText('Kiểm tra 你好 nǐ hǎo');
  await evidence(hv, 'TC-054', 1);
  // 2. GV tab.
  await openRankingTab(gv, A.id);
  await expect(gv.locator('.rk-tbl .strong', { hasText: 'Nguyễn Văn Ân' })).toHaveText('Nguyễn Văn Ân');
  await evidence(gv, 'TC-054', 2);
});
