import { expect, test } from '@playwright/test';
import {
  S03,
  T07,
  archiveStep,
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
  text,
} from './helpers';

test('[004:AC-8.4] TC-058 restore: at once, same place, unsaved edits kept, HV marks back', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await publishedStep(page, les.id, 'Một', [text('<p>一</p>')]);
  const cards = ['你', '好', '我', '他', '她'].map((front, i) => ({ id: `c${i}`, front, meaning: `nghĩa ${i}` }));
  const id = await publishedStep(page, les.id, 'Hai', [deck(cards)]);
  await publishedStep(page, les.id, 'Ba', [text('<p>三</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  for (const c of ['c0', 'c1', 'c2']) await markCard(hv.page, cls.id, id, 'k', c, 'known');
  await archiveStep(page, les.id, id);

  await page.goto(T07(cur.id, les.id));
  await page.getByRole('switch', { name: 'Hiện mục lưu trữ (1)' }).click();
  const step = page.getByRole('region', { name: 'Bước học 2' });
  await step.getByLabel('Mục tiêu bước học').fill('Chưa lưu');
  await step.getByRole('button', { name: 'Khôi phục' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText('Đã khôi phục · Đã lưu').first()).toBeVisible();
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await expect(step.getByLabel('Tên bước học')).toHaveValue('Hai');
  await expect(step.getByLabel('Mục tiêu bước học')).toHaveValue('Chưa lưu');
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await evidence(page, 'TC-058', 1);

  await hv.page.goto(S03(cls.id, id));
  await expect(hv.page.getByText('Bước 2/3')).toBeVisible();
  await expect(hv.page.getByText('5 thẻ · Đã thuộc 3/5')).toBeVisible();
  await evidence(hv.page, 'TC-058', 2);
});
