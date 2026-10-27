import { expect, test } from '@playwright/test';
import {
  S03,
  S04,
  deck,
  evidence,
  gvPage,
  hideSection,
  hvPage,
  markCard,
  newClass,
  newCurriculum,
  newLesson,
  publishLesson,
  publishedStep,
} from './helpers';

test('[004:AC-13.4] [004:AC-13.7] TC-079 a hidden Bài học section: A05, then back with the marks', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Từ mới', [
    deck([{ id: 'c1', front: '你', meaning: 'bạn' }, { id: 'c2', front: '好', meaning: 'tốt' }]),
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await markCard(hv.page, cls.id, step, 'k', 'c1', 'known');

  await hideSection(page, cls.id, les.id, 'lesson');
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByText('Không tìm thấy nội dung bạn yêu cầu.')).toBeVisible();
  await expect(hv.page.getByText('Từ mới')).toHaveCount(0);
  await evidence(hv.page, 'TC-079', 1);

  await hideSection(page, cls.id, les.id, 'lesson', false);
  await hv.page.goto(S03(cls.id, step));
  await expect(hv.page.getByRole('heading', { name: 'Từ mới' })).toBeVisible();
  await expect(hv.page.getByText('2 thẻ · Đã thuộc 1/2')).toBeVisible();
  await hv.page.goto(S04(cls.id, step, 'k'));
  await expect(hv.page.getByText('Đã thuộc', { exact: true }).first()).toBeVisible();
  await evidence(hv.page, 'TC-079', 2);
});
