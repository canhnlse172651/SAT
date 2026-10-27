import { expect, test } from '@playwright/test';
import { S03, evidence, gvPage, hvPage, newClass, newCurriculum, newLesson, publishLesson, publishedStep, text, vnToday } from './helpers';

test('[004:AC-13.3] TC-078 a class that has not started yet', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const step = await publishedStep(page, les.id, 'Chưa mở', [text('<p>文</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const start = vnToday(1);
  const cls = await newClass(page, cur.id, [hv.who.user.id], start);
  await hv.page.goto(S03(cls.id, step));
  const [y, m, d] = start.split('-');
  await expect(hv.page.getByText(`Lớp chưa bắt đầu. Nội dung sẽ mở từ ngày ${d}/${m}/${y}.`)).toBeVisible();
  await expect(hv.page.getByText('文')).toHaveCount(0);
  await expect(hv.page.getByRole('heading', { name: 'Chưa mở' })).toHaveCount(0);
  await evidence(hv.page, 'TC-078');
});
