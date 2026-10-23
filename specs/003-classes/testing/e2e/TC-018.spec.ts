import { test, expect } from '@playwright/test';
import {
  apiAs,
  createClass,
  ddmmyyyy,
  newWorkspaceGv,
  ok,
  seedCurriculum,
  shot,
  signIn,
  studentByEmail,
  uid,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-5.3] [003:AC-5.6] [003:NFR-1] TC-018 tạo lớp: đúng một lớp, T04 Tổng quan, mọi phần Hiển thị, HV thấy lớp', async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-018 GT ${uid()}`, [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const name = `TC-018 Lớp ${uid()}`;
  await signIn(page, 'GV');
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  for (const n of ['Học viên Một', 'Học viên Hai', 'Học viên Ba'])
    await page.getByRole('checkbox', { name: n }).check();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByLabel('Tìm giáo trình').fill(cur.name);
  await page.getByRole('radio', { name: new RegExp(cur.name) }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  const create = page.getByRole('button', { name: 'Tạo lớp' });
  // Three clicks in a row, before the page can react.
  await create.evaluate((b: HTMLButtonElement) => {
    b.click();
    b.click();
    b.click();
  });
  await expect(page).toHaveURL(/\/gv\/lop-hoc\/[0-9a-f]{24}$/);
  await expect(page.getByText(`Đã tạo lớp «${name}»`, { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
  await shot(page, 'TC-018', 1);

  const found = await ok(gv, 'GET', `/classes?status=all&q=${encodeURIComponent(name)}`);
  expect(found.total).toBe(1);
  const classId = found.items[0].id;
  expect(found.items[0].memberCount).toBe(3);
  await page.goto('/gv/lop-hoc');
  await page.getByLabel('Tìm theo tên lớp').fill(name);
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText('3/100');

  await page.goto(`/gv/lop-hoc/${classId}?tab=noi-dung`);
  await expect(page.getByText('Đang ẩn')).toHaveCount(0);
  await expect(page.getByText('Hiển thị', { exact: true })).toHaveCount(2);
  await page.goto(`/gv/lop-hoc/${classId}?tab=hoc-vien`);
  await expect(page.getByRole('row').filter({ hasText: 'Học viên Một' })).toContainText(ddmmyyyy(vnDay()));

  const hv1 = await studentByEmail(gv, 'hv1@sat.dev');
  const hvCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hvPage = await hvCtx.newPage();
  await signIn(hvPage, 'HV', hv1.id);
  await hvPage.goto('/hv');
  await expect(hvPage.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  await shot(hvPage, 'TC-018', 2);

  // NFR-1: "Tạo lớp" with 100 HV.
  const gvB = await newWorkspaceGv();
  const ids: string[] = [];
  for (let i = 0; i < 100; i += 20)
    ids.push(
      ...(await Promise.all(
        Array.from({ length: 20 }, async (_, k) =>
          (await ok(gvB, 'POST', '/students', { displayName: `HV ${i + k}`, email: `nfr${i + k}+${uid()}@x.dev` })).id,
        ),
      )),
    );
  const c100 = await seedCurriculum(gvB, 'NFR GT', [{ name: 'Bài 1', steps: 1 }]);
  const t0 = Date.now();
  const big = await createClass(gvB, { name: 'NFR 100', curriculumId: c100.id, studentIds: ids });
  const ms = Date.now() - t0;
  expect(big.memberCount).toBe(100);
  expect(ms).toBeLessThanOrEqual(2000);
  test.info().annotations.push({ type: 'NFR-1', description: `create with 100 HV: ${ms} ms` });
});
