import { expect, test } from '@playwright/test';
import {
  S03,
  T07,
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

test('[004:AC-11.6] [004:AC-11.7] TC-071 "Xong" keeps the deck in the step; saved with the step', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await publishedStep(page, les.id, 'Bước', [
    deck([{ id: 'c1', front: '你', meaning: 'bạn' }, { id: 'c2', front: '好', meaning: 'tốt' }], 'Từ mới'),
  ]);
  await publishLesson(page, les.id);
  const hv = await hvPage(browser);
  const cls = await newClass(page, cur.id, [hv.who.user.id]);
  await hv.page.goto(S03(cls.id, id));
  await expect(hv.page.getByText('2 thẻ · Đã thuộc 0/2')).toBeVisible();

  await page.goto(T07(cur.id, les.id));
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Thêm thẻ' }).click();
  await dialog.getByLabel('Mặt trước (chữ Hán) *').nth(2).fill('我');
  await dialog.getByRole('button', { name: 'Xong' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(dialog).toHaveCount(0);
  const block = step.locator('.st-block').nth(0);
  await expect(block).toContainText('Từ mới · 3 thẻ · 1 trường chưa hợp lệ');
  await expect(block.getByRole('button', { name: 'Soạn bộ thẻ' })).toBeVisible();
  await expect(step.getByText('Chưa lưu', { exact: true })).toBeVisible();
  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(step.getByText('Không thể xuất bản — Chưa hoàn chỉnh: Khối 1 · Bộ thẻ từ vựng: 1 thẻ chưa hợp lệ')).toBeVisible();
  await evidence(page, 'TC-071', 1);

  await block.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await dialog.getByLabel('Nghĩa *').nth(2).fill('tôi');
  await dialog.getByRole('button', { name: 'Xong' }).click();
  await step.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);

  await hv.page.goto(S03(cls.id, id));
  await expect(hv.page.getByText('3 thẻ · Đã thuộc 0/3')).toBeVisible();
  await evidence(hv.page, 'TC-071', 2);
});
