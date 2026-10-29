import { type Locator, type Page, expect, test } from '@playwright/test';
import { evidence, gvPage, myScore, openRankingTab, openS09, rankingSeg, tc029Data, closeOpened } from './helpers';

test.afterEach(closeOpened);

const LONG = 'Lê Văn Dũng Nguyễn Thị Hồng Nhung Phạm';

async function noHorizontalScroll(page: Page) {
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw, 'page scroll width ≤ viewport').toBeLessThanOrEqual(cw);
}
async function atLeast44(targets: Locator, what: string) {
  const n = await targets.count();
  expect(n, what).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const b = await targets.nth(i).boundingBox();
    expect(b, what).not.toBeNull();
    expect.soft(Math.round(b!.width), `${what} #${i} width`).toBeGreaterThanOrEqual(44);
    expect.soft(Math.round(b!.height), `${what} #${i} height`).toBeGreaterThanOrEqual(44);
  }
}

test('[008:NFR-5] TC-064 S09 at 360–430 px without horizontal scroll, ≥ 44 px targets; the GV tab at 1024 px', async ({ browser }) => {
  test.setTimeout(150_000);
  const { page: gv } = await gvPage(browser);
  const d = await tc029Data(browser, gv, { dungName: LONG });
  const hv = d.pages.Dũng;

  for (const [k, width] of [360, 430].entries()) {
    await hv.setViewportSize({ width, height: 800 });
    await openS09(hv);
    await noHorizontalScroll(hv);
    // The long name is cut with "…".
    const name = hv.locator('.rk-lrow', { hasText: 'Lê Văn Dũng' }).locator('.rk-lrow__name');
    const cut = await name.evaluate((el) => ({
      overflow: getComputedStyle(el).textOverflow,
      truncated: el.scrollWidth > el.clientWidth,
    }));
    expect(cut).toEqual({ overflow: 'ellipsis', truncated: true });
    await atLeast44(hv.locator('.rk-pod, .rk-lrow, .rk-pin'), 'board rows');
    await atLeast44(hv.getByRole('button', { name: 'Làm mới' }), '"Làm mới"');
    await atLeast44(hv.getByRole('radio'), 'segments');
    await atLeast44(hv.getByRole('button', { name: 'Cách tính điểm' }), '"Cách tính điểm"');
    await evidence(hv, 'TC-064', k * 2 + 1);
    await myScore(hv);
    await noHorizontalScroll(hv);
    await atLeast44(hv.locator('.rk-row'), '"Điểm của tôi" rows');
    await evidence(hv, 'TC-064', k * 2 + 2);
    await rankingSeg(hv);
  }

  for (const [k, width] of [1024, 1280].entries()) {
    await gv.setViewportSize({ width, height: 800 });
    await openRankingTab(gv, d.A.id);
    await noHorizontalScroll(gv);
    await evidence(gv, 'TC-064', 5 + k);
    // Usable: every column readable and the row's expand button reachable on screen.
    await expect(gv.getByRole('button', { name: 'Làm mới' })).toBeInViewport();
    await expect(gv.getByRole('columnheader', { name: 'Cập nhật lần cuối' })).toBeInViewport({ ratio: 1 });
    await expect(gv.getByRole('button', { name: 'Chi tiết điểm của Nguyễn Văn An' })).toBeInViewport({ ratio: 1 });
  }
});
