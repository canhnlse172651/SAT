import { expect, test } from '@playwright/test';
import {
  S11,
  T07,
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

test('[004:AC-8.3] [004:AC-8.5] TC-057 archive: blocked while unsaved, then at once without asking', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await publishedStep(page, les.id, 'Lưu trữ tôi', [
    text('<p>文</p>'),
    deck([{ id: 'c1', front: '你', meaning: 'bạn' }]),
  ]);
  await publishedStep(page, les.id, 'Ở lại', [text('<p>留</p>')]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await markCard(hv.page, cls.id, id, 'k', 'c1', 'known');

  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByLabel('Tên bước học').fill('Lưu trữ tôi (sửa)');
  const archive = step.getByRole('button', { name: 'Lưu trữ' });
  await expect(archive).toHaveAttribute('aria-disabled', 'true');
  await expect(step.getByText('Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ').first()).toBeVisible();
  await archive.click({ force: true }); // nothing happens
  await expect(step.getByText('Đã xuất bản', { exact: true })).toBeVisible();
  await evidence(page, 'TC-057', 1);

  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await step.getByRole('button', { name: 'Lưu trữ' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByText('Đã lưu trữ · Đã lưu').first()).toBeVisible();
  await expect(page.getByRole('region', { name: /^Bước học \d+$/ })).toHaveCount(1);
  await evidence(page, 'TC-057', 2);

  await hv.page.goto(S11(cls.id, les.id));
  await expect(hv.page.getByText('Ở lại')).toBeVisible();
  await expect(hv.page.getByText(/Lưu trữ tôi/)).toHaveCount(0);
});
