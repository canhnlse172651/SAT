import { expect, test } from '@playwright/test';
import { T07, addStep, deck, evidence, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-7.7] TC-054 T07 and T08 in web layout only, at 1280 and 1024 px', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Bước', { goal: '', blocks: [deck([{ id: 'c1', front: '你', meaning: 'bạn' }])] });
  for (const width of [1280, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(T07(cur.id, les.id));
    await expect(page.getByRole('region', { name: 'Bước học 1' })).toBeVisible();
    const check = async () => {
      await expect(page.getByText(/Web \/ Mobile/)).toHaveCount(0);
      await expect(page.getByRole('radio', { name: /^(Web|Mobile)$/ })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Xem như học viên' })).toHaveCount(0);
      await expect(page.locator('.pv-frame--mobile')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    };
    await check();
    const region = await page.getByRole('region', { name: 'Bước học 1' }).boundingBox();
    expect(region!.width).toBeGreaterThan(width * 0.6);
    await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await check();
    await evidence(page, 'TC-054', width === 1280 ? 1 : 2);
    await page.getByRole('dialog').getByRole('button', { name: 'Xong' }).click();
  }
});
