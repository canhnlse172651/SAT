import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-11.4] TC-069 card field rules in T08', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', {
    goal: '',
    blocks: [
      deck([
        { id: 'c1', front: '', meaning: '' },
        { id: 'c2', front: '好', meaning: 'tốt' },
        { id: 'c3', front: '你', meaning: 'bạn' },
      ]),
    ],
  });
  await page.goto(T07(cur.id, les.id));
  await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  const card = (n: number) => dialog.locator('.st-card').nth(n - 1);
  await card(2).getByLabel('Mặt trước (chữ Hán) *').fill('hi');
  await card(3).getByLabel('Pinyin', { exact: true }).fill('ni9');
  await card(3).getByLabel('Pinyin', { exact: true }).blur();
  await expect(card(1).getByText('Chưa hoàn chỉnh: Vui lòng nhập mặt trước')).toBeVisible();
  await expect(card(1).getByText('Chưa hoàn chỉnh: Vui lòng nhập nghĩa')).toBeVisible();
  await expect(card(2).getByText('Mặt trước phải có chữ Hán', { exact: true })).toBeVisible();
  await expect(card(3).getByText('Pinyin không hợp lệ: ni9', { exact: true })).toBeVisible();
  await expect(card(2).getByLabel('Mặt trước (chữ Hán) *')).toHaveAttribute('aria-invalid', 'true');
  await evidence(page, 'TC-069');
});
