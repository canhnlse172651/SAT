import { expect, test } from '@playwright/test';
import { S05, classWithSets, evidence, gvPage, hvPage, mcq, png, set, upload } from './helpers';

test('[005:AC-3.4] TC-026 zooming images keeps the answer', async ({ browser }) => {
  const { page: gv } = await gvPage(browser);
  const stemImg = (await upload(gv, 'de.png', png())).body;
  const optImg = (await upload(gv, 'pa.png', png())).body;
  const d = await classWithSets(gv, [
    {
      title: 'Bộ ảnh',
      content: set([
        mcq('Nhìn hình', [{ text: 'Một', image: optImg }, { text: 'Hai', correct: true }, { text: 'Ba' }], { image: stemImg }),
      ]),
    },
  ]);
  const { page } = await hvPage(browser, d.students[0]!);
  await page.goto(S05(d.cls, d.sets[0]!));
  await page.getByRole('button', { name: 'Bắt đầu làm' }).click();
  await page.getByRole('radio', { name: /^B\s*Hai/ }).check();
  await expect(page.getByRole('radio', { name: /^B\s*Hai/ })).toBeChecked();

  // 1. Tap the stem image, close it.
  await page.getByRole('button', { name: 'Phóng to Hình của câu 1' }).click();
  await expect(page.getByRole('dialog', { name: 'Hình của câu 1' }).getByRole('img')).toBeVisible();
  await evidence(page, 'TC-026', 1);
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // 2. Tap the image of option A, close it.
  await page.getByRole('button', { name: 'Phóng to Hình phương án A' }).click();
  await expect(page.getByRole('dialog', { name: 'Hình phương án A' }).getByRole('img')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // The choice B is unchanged.
  await expect(page.getByRole('radio', { name: /^B\s*Hai/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /^A\s*Một/ })).not.toBeChecked();
  await evidence(page, 'TC-026', 2);
});
