// Foundation walking skeleton (infra): routing, role guards and shells against the production build.
// Cites 001 ACs only where the behaviour is theirs (AC-16.3, AC-16.4, AC-20.4); the rest is infrastructure.
import { expect, test } from '@playwright/test';
import { loginAs } from './fixtures';

const GV_NAV = [
  'Dashboard',
  'Lớp học',
  'Giáo trình',
  'Bài thi',
  'Học viên',
  'Kho tự học',
  'Tài khoản',
];
const HV_TABS = ['Lớp của tôi', 'Bài thi', 'Tự học', 'Xếp hạng', 'Tài khoản'];

test.describe('anonymous', () => {
  test('GV area redirects to A01 with returnTo', async ({ page }) => {
    await page.goto('/gv');
    await expect(page).toHaveURL(/\/dang-nhap\?returnTo=(%2F|\/)gv$/);
  });

  test('unknown path shows A05; health, ready 200; session 401 without cookie', async ({
    page,
    request,
  }) => {
    await page.goto('/khong/co/trang/nay');
    await expect(
      page.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeVisible();
    expect((await request.get('/api/health')).status()).toBe(200);
    expect((await request.get('/api/ready')).status()).toBe(200);
    expect((await request.get('/api/session')).status()).toBe(401);
  });

  test('/dev/ui is not served by the production build (falls through to A05)', async ({ page }) => {
    await page.goto('/dev/ui');
    await expect(
      page.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeVisible();
  });
});

test.describe('GV at 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('T01 in the GV shell, sidebar order, navigates to T23', async ({ page }) => {
    const me = await loginAs(page, 'GV');
    expect(me.user.role).toBe('GV');
    await page.goto('/gv');
    await expect(page.locator('[data-screen="T01"]')).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
    await expect(nav.getByRole('link')).toHaveText(GV_NAV);
    await nav.getByRole('link', { name: 'Kho tự học' }).click();
    await expect(page).toHaveURL(/\/gv\/kho-tu-hoc$/);
    await expect(page.locator('[data-screen="T23"]')).toBeVisible();
    await expect(nav).toBeVisible();
  });

  test('[001:AC-16.4] GV on an S01-S12 path lands on T01', async ({ page }) => {
    await loginAs(page, 'GV');
    await page.goto('/hv/xep-hang');
    await expect(page).toHaveURL(/\/gv$/);
    await expect(page.locator('[data-screen="T01"]')).toBeVisible();
  });

  test('[001:AC-20.4] GV on an S13-S20 path gets A05', async ({ page }) => {
    await loginAs(page, 'GV');
    await page.goto('/tu-hoc/tu-vung');
    await expect(
      page.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeVisible();
  });
});

test.describe('HV at 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('S01 in the HV shell with a one-line tab bar', async ({ page }) => {
    const me = await loginAs(page, 'HV');
    expect(me.user.role).toBe('HV');
    await page.goto('/hv');
    await expect(page.locator('[data-screen="S01"]')).toBeVisible();
    const tabs = page.getByRole('navigation', { name: 'Thanh tab' });
    await expect(tabs.getByRole('link')).toHaveText(HV_TABS);

    const boxes = await tabs.getByRole('link').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }),
    );
    expect(boxes).toHaveLength(HV_TABS.length);
    const first = boxes[0]!;
    for (const b of boxes) {
      expect(Math.abs(b.top - first.top)).toBeLessThan(2); // all on one row
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(390);
    }
    // each label renders on a single text line (no wrapping inside a tab)
    const lineCounts = await tabs
      .getByRole('link')
      .evaluateAll((els) =>
        els.map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
        }),
      );
    for (const n of lineCounts) expect(n).toBe(1);
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
  });

  test('[001:AC-16.3] HV on a T path lands on S01', async ({ page }) => {
    await loginAs(page, 'HV');
    await page.goto('/gv/lop-hoc');
    await expect(page).toHaveURL(/\/hv$/);
    await expect(page.locator('[data-screen="S01"]')).toBeVisible();
  });
});
