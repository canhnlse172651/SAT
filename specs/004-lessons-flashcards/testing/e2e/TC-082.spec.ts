import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  addSet,
  deck,
  evidence,
  gvPage,
  hvPage,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishSet,
  publishedStep,
  text,
} from './helpers';

test('[004:AC-13.8] TC-082 every step opens at once, in any order', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  let target = '';
  let lesson3 = '';
  for (const n of [1, 2, 3]) {
    const les = await newLesson(page, cur.id, `Bài ${n}`);
    await publishedStep(page, les.id, `B${n} bước 1`, [text('<p>一</p>')]);
    const two = await publishedStep(page, les.id, `B${n} bước 2`, [deck([{ id: 'c1', front: '你', meaning: 'bạn' }])]);
    if (n === 3) {
      target = two;
      lesson3 = les.id;
      const set = await addSet(page, les.id);
      await publishSet(page, les.id, set, 'Bộ chưa có hạn');
    }
    await publishLesson(page, les.id);
  }
  expect(lesson3).not.toBe('');
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, target));
  await expect(hv.page.getByRole('heading', { name: 'B3 bước 2' })).toBeVisible();
  await expect(hv.page.getByText(/học bài trước|bị khóa|chưa mở khóa/i)).toHaveCount(0);
  await evidence(hv.page, 'TC-082', 1);
  await hv.page.goto(S04(cls.id, target, 'k'));
  await expect(hv.page.getByText('Thẻ 1/1')).toBeVisible();
  await evidence(hv.page, 'TC-082', 2);
});
