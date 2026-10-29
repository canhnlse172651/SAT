import { expect, test } from '@playwright/test';
import { deadline, evidence, gvPage, hvPage, newClass, openRankingTab, openS09, people, r1, submitScore, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-13.4] TC-061 offline refresh shows the error with "Thử lại", never the old list', async ({ browser }) => {
  test.setTimeout(90_000);
  const { ctx: gctx, page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  await deadline(gv, A.id, r.sets.S1a);
  const { ctx: hctx, page: hv } = await hvPage(browser, An);
  await submitScore(hv, A.id, r.sets.S1a, 9, 10);
  await openS09(hv);
  await openRankingTab(gv, A.id);

  for (const [k, ctx, page, list] of [
    [1, hctx, hv, '.rk-pod, .rk-lrow'],
    [2, gctx, gv, '.rk-tbl'],
  ] as const) {
    // 1. Offline, "Làm mới".
    await ctx.setOffline(true);
    await page.getByRole('button', { name: 'Làm mới' }).click();
    await expect(page.getByText('Không tải được bảng xếp hạng. Vui lòng thử lại.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
    await expect(page.locator(list)).toHaveCount(0);
    await evidence(page, 'TC-061', k * 2 - 1);
    // 2. Online, "Thử lại".
    await ctx.setOffline(false);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.locator(list).first()).toBeVisible();
    await expect(page.getByText('Không tải được bảng xếp hạng. Vui lòng thử lại.')).toHaveCount(0);
    await evidence(page, 'TC-061', k * 2);
  }
});
