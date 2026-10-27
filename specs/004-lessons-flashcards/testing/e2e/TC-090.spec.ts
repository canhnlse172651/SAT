import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  T07,
  T21,
  deck,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
} from './helpers';

const CARDS = ['一', '二', '三', '四', '五'].map((front, i) => ({ id: `c${i + 1}`, front, meaning: `số ${i + 1}` }));

test('[004:AC-16.5] [004:AC-16.7] [004:AC-17.1] [004:AC-17.2] [004:AC-17.3] [004:AC-17.4] [004:NFR-6] TC-090 marks, summary, study options; marks are the HV\'s own', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Số đếm', [deck(CARDS, 'Số')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const c1 = await newClass(page, cur.id, [hv.who.user.id]);
  const c2 = await newClass(page, cur.id, [hv.who.user.id]);
  const p = hv.page;
  await p.goto(S04(c1.id, step, 'k'));
  const answer = async (m: 'Đã thuộc' | 'Chưa thuộc', next: string | null) => {
    await p.getByRole('button', { name: m, exact: true }).click();
    if (next) await expect(p.getByText(next)).toBeVisible();
  };
  await answer('Đã thuộc', 'Thẻ 2/5');
  await answer('Chưa thuộc', 'Thẻ 3/5');
  await answer('Đã thuộc', 'Thẻ 4/5');
  await answer('Chưa thuộc', 'Thẻ 5/5');
  await answer('Đã thuộc', null);
  const summary = p.getByRole('status').filter({ hasText: 'Tổng kết bộ thẻ' });
  await expect(summary).toContainText('Đã thuộc 3 · Chưa thuộc 2 · Chưa đánh dấu 0');
  await expect(summary.getByRole('button', { name: 'Học thẻ chưa thuộc (2)' })).toBeVisible();
  await expect(summary.getByRole('button', { name: 'Học lại tất cả' })).toBeVisible();
  await expect(summary.getByRole('button', { name: 'Quay lại bước học' })).toBeVisible();
  await evidence(p, 'TC-090', 1);

  await summary.getByRole('button', { name: 'Học thẻ chưa thuộc (2)' }).click();
  await expect(p.getByText('Thẻ 1/2')).toBeVisible();
  await expect(p.getByRole('button', { name: /^Mặt trước: 二/ })).toBeVisible();
  await p.getByRole('switch', { name: 'Chỉ học thẻ chưa thuộc' }).click(); // off: all cards again
  await expect(p.getByText('Thẻ 1/5')).toBeVisible();
  await p.getByRole('switch', { name: 'Trộn thẻ' }).click();
  await expect(p.getByText('Thẻ 1/5')).toBeVisible();
  const shuffled: string[] = [];
  for (let i = 0; i < 5; i++) {
    const name = await p.getByRole('button', { name: /^Mặt trước: / }).getAttribute('aria-label');
    shuffled.push(name!.replace('Mặt trước: ', '').replace('. Chạm để lật thẻ', ''));
    if (i < 4) await p.getByRole('button', { name: 'Thẻ sau' }).click();
  }
  expect([...shuffled].sort()).toEqual(['一', '二', '三', '四', '五'].sort());
  await p.getByRole('switch', { name: 'Trộn thẻ' }).click();

  // Mark everything known, then only unknown cards.
  await p.goto(S04(c1.id, step, 'k'));
  for (let i = 0; i < 5; i++) await p.getByRole('button', { name: 'Đã thuộc', exact: true }).click();
  await p.getByRole('button', { name: 'Học lại tất cả' }).click();
  await p.getByRole('switch', { name: 'Chỉ học thẻ chưa thuộc' }).click();
  await expect(p.getByText('Bạn đã thuộc tất cả 5 thẻ.')).toBeVisible();
  await expect(p.getByRole('button', { name: 'Học lại tất cả' })).toBeVisible();
  await evidence(p, 'TC-090', 2);

  // Same deck in the other class: same marks.
  await p.goto(S03(c2.id, step));
  await expect(p.getByText('5 thẻ · Đã thuộc 5/5')).toBeVisible();

  // The GV sees none of the HV's marks anywhere (T21's own preview count stays 0/5).
  for (const path of [T07(cur.id, les.id), T21(cur.id, les.id), `/gv/lop-hoc/${c1.id}`]) {
    await page.goto(path);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/Đã thuộc [1-9]|Chưa thuộc [1-9]|5\/5/)).toHaveCount(0);
  }
});
