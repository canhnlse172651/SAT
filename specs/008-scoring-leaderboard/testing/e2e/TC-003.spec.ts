import { expect, test } from '@playwright/test';
import { LESSONS, api, evidence, expectSummary, gvPage, hvPage, lessonGroup, myScore, newClass, openS09, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-1.3] TC-003 steps and flashcards add no points; a set without Hạn nộp is not counted', async ({ browser }) => {
  test.setTimeout(90_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);

  const { page: hv } = await hvPage(browser, An);
  // 1. An opens Bài 4 and studies its step (S03) and the whole "Từ mới" deck (S04: both cards marked known).
  await hv.goto(`/hv/lop/${A.id}`);
  await hv.getByRole('link', { name: /Bài 4 – 学习 xuéxí/ }).first().click();
  await hv.getByRole('link', { name: /Học từ 学习/ }).first().click();
  await expect(hv.getByText('学习 xuéxí = học')).toBeVisible();
  for (const card of ['c1', 'c2'])
    await api(hv, 'PUT', '/api/learn/marks', { classId: A.id, stepId: r.step4, deckId: r.deck4, cardId: card, mark: 'known' }, 204);
  // 2. S09.
  await openS09(hv);
  await myScore(hv);
  await expectSummary(hv, { score: '0,0', rank: 'Chưa có hạng', avgEx: '0,0', nEx: 0 });
  await expect(lessonGroup(hv, LESSONS[3])).toHaveCount(0);
  await evidence(hv, 'TC-003', 1);
});
