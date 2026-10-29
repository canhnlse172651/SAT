import { expect, test } from '@playwright/test';
import { GV_VIEW, HV_VIEW, ORIGIN, S09, T04_RANK, evidence, gvPage, newClass, people, r1, closeOpened } from './helpers';

test.afterEach(closeOpened);

test('[008:AC-9.5] TC-047 signed out: S09 and the ranking tab go through A01 and come back', async ({ browser }) => {
  test.setTimeout(120_000);
  const { page: gv } = await gvPage(browser);
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);

  const ctx = await browser.newContext({ viewport: HV_VIEW, baseURL: ORIGIN });
  const page = await ctx.newPage();
  await page.request.delete('/api/dev/throttles', { headers: { Origin: ORIGIN } });
  // 1. /hv/xep-hang signed out → A01; sign in as an HV (seed hv1) → back on S09.
  await page.goto(S09);
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=/);
  await page.getByLabel('Email').fill('hv1@sat.dev');
  await page.getByLabel('Mật khẩu').fill('HocVien2026');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/hv\/xep-hang$/);
  await expect(page.locator('[data-screen="S09"]')).toBeVisible();
  await evidence(page, 'TC-047', 1);

  // 2. Đăng xuất; the GV ranking tab → A01; sign in as the GV → back on T04 tab "Xếp hạng".
  await page.getByRole('link', { name: 'Tài khoản' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.getByRole('alertdialog', { name: 'Đăng xuất khỏi SAT?' }).getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/dang-nhap/);
  await page.setViewportSize(GV_VIEW);
  await page.goto(T04_RANK(A.id));
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=/);
  await page.getByLabel('Email').fill('lan@sat.dev');
  await page.getByLabel('Mật khẩu').fill('LanHSK2026');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(new RegExp(`/gv/lop-hoc/${A.id}\\?tab=xep-hang$`));
  await expect(page.getByRole('tab', { name: 'Xếp hạng' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-screen="T04-xep-hang"]')).toBeVisible();
  await evidence(page, 'TC-047', 2);
  await ctx.close();
});
