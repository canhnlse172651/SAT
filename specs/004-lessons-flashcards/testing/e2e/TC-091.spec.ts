import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  deck,
  evidence,
  gvPage,
  hvPage,
  markCard,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
  saveStep,
} from './helpers';

test('[004:AC-16.6] [004:AC-17.5] TC-091 marking offline is retried; marks after the GV edits the deck', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const cards = [
    { id: 'c1', front: '一', meaning: 'một' },
    { id: 'c2', front: '二', meaning: 'hai' },
    { id: 'c3', front: '三', meaning: 'ba' },
  ];
  const step = await publishedStep(page, les.id, 'Đếm', [deck(cards)]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  for (const c of cards) await markCard(hv.page, cls.id, step, 'k', c.id, 'known');

  await hv.page.goto(S04(cls.id, step, 'k'));
  await expect(hv.page.getByText('Thẻ 1/3')).toBeVisible();
  await hv.ctx.setOffline(true);
  await hv.page.getByRole('button', { name: 'Chưa thuộc', exact: true }).click();
  await expect(hv.page.getByText('Chưa lưu được đánh dấu — sẽ tự thử lại khi có mạng.')).toBeVisible();
  await expect(hv.page.getByText('Thẻ 2/3')).toBeVisible();
  await evidence(hv.page, 'TC-091', 1);
  const sent = hv.page.waitForRequest((r) => r.url().includes('/api/learn/marks') && r.method() === 'PUT');
  await hv.ctx.setOffline(false);
  await sent;
  await expect(hv.page.getByText('Chưa lưu được đánh dấu — sẽ tự thử lại khi có mạng.')).toHaveCount(0);
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('3 thẻ · Đã thuộc 2/3')).toBeVisible();

  // GV: card 2 edited, card 3 deleted, a new card added.
  await saveStep(page, les.id, step, 'Đếm', {
    goal: '',
    blocks: [deck([cards[0]!, { ...cards[1]!, meaning: 'số hai' }, { id: 'c4', front: '四', meaning: 'bốn' }])],
  });
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('3 thẻ · Đã thuộc 1/3')).toBeVisible();
  await hv.page.goto(S04(cls.id, step, 'k'));
  await expect(hv.page.getByText('Chưa thuộc', { exact: true }).first()).toBeVisible(); // card 1: unknown (was marked offline)
  await hv.page.getByRole('button', { name: 'Thẻ sau' }).click();
  await expect(hv.page.locator('.fc-head')).toContainText('Đã thuộc'); // card 2 kept its mark
  await hv.page.getByRole('button', { name: 'Thẻ sau' }).click();
  await expect(hv.page.locator('.fc-head')).toContainText('Chưa đánh dấu'); // the new card
  await evidence(hv.page, 'TC-091', 2);
});
