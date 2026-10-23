import { test, expect } from '@playwright/test';
import { call, newStudent, newWorkspaceGv, shot, signInLike, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-3.2] [003:NFR-2] TC-009 tìm HV không dấu / hoa thường, ≤ 1 giây với 2.000 HV', async ({ page }) => {
  test.setTimeout(600_000);
  const gv = await newWorkspaceGv();
  const email = `an+${uid()}@x.dev`;
  await newStudent(gv, 'Nguyễn Văn An', { email });
  // NFR-2: a workspace of 2.000 HV.
  const batch = 50;
  for (let i = 1; i < 2000; i += batch) {
    await Promise.all(
      Array.from({ length: Math.min(batch, 2000 - i) }, (_, k) =>
        call(gv, 'POST', '/students', {
          displayName: `Học viên ${i + k}`,
          email: `bulk${i + k}+${uid()}@x.dev`,
        }),
      ),
    );
  }
  await page.goto('/');
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-009 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(page.getByText(/· 2000 học viên ·/)).toBeVisible();

  const list = page.getByRole('group', { name: 'Học viên trong workspace' });
  const search = async (q: string) => {
    const t0 = Date.now();
    await page.getByLabel('Tìm học viên').fill(q);
    return t0;
  };
  // Measured from the last keystroke; the picker waits 250 ms after typing stops.
  let t0 = await search('nguyen');
  await expect(list.getByRole('checkbox', { name: 'Nguyễn Văn An' })).toBeVisible();
  const elapsed = Date.now() - t0;
  expect(elapsed).toBeLessThanOrEqual(1000);
  t0 = await search(email.toUpperCase());
  await expect(list.getByRole('checkbox')).toHaveCount(1);
  expect(Date.now() - t0).toBeLessThanOrEqual(1000);
  await expect(list.getByRole('checkbox', { name: 'Nguyễn Văn An' })).toBeVisible();
  await shot(page, 'TC-009', 1);
  await search('zzz');
  await expect(page.getByText('Không tìm thấy học viên phù hợp', { exact: true })).toBeVisible();
  await shot(page, 'TC-009', 2);
  test.info().annotations.push({ type: 'NFR-2', description: `search "nguyen" shown after ${elapsed} ms` });
});
