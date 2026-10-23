import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signIn, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-15.1] [003:AC-15.2] [003:AC-15.3] [003:NFR-1] TC-051 tab Nội dung: dòng Bài, ô phần, Bài Nháp đặt trước; 50 Bài ≤ 2 giây', async ({
  page,
  browser,
}) => {
  test.setTimeout(300_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-051 GT', [
    { name: 'Bài 1', steps: 2, sets: 3, draftSets: 1 },
    { name: 'Bài 2', steps: 1, sets: 1, draft: true },
    { name: 'Bài 3', draftSets: 1, draft: true },
  ]);
  const hv = await newStudent(gv, 'Rin Nội dung', { activate: true });
  const cls = await createClass(gv, { name: 'TC-051 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);

  const panel = page.getByRole('tabpanel');
  await expect(panel.getByText('3 bài · 0 phần đang ẩn với lớp này', { exact: true })).toBeVisible();
  const rows = panel.getByRole('row').filter({ has: page.getByRole('cell') });
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Bài 1');
  await expect(rows.nth(0)).toContainText('Đã xuất bản');
  await expect(rows.nth(0)).toContainText('2 bước học');
  await expect(rows.nth(0)).toContainText('3 bộ bài tập');
  await expect(rows.nth(1)).toContainText('Nháp — học viên chưa thấy');
  await expect(rows.nth(2).getByText('Chưa có nội dung đã xuất bản', { exact: true })).toHaveCount(2);
  await expect(rows.nth(0).getByText('Hiển thị', { exact: true })).toHaveCount(2);
  await expect(rows.nth(0).getByRole('button', { name: 'Ẩn với lớp: Bài học của Bài 1' })).toHaveText('Ẩn với lớp');
  await shot(page, 'TC-051', 1);

  await rows.nth(0).getByRole('link', { name: 'Bài 1' }).click();
  await expect(page).toHaveURL(new RegExp(`/gv/giao-trinh/${cur.id}/bai/${cur.lessons[0]!.id}$`));
  await page.goBack();

  // Hide Bài học of the draft Bài 2 in advance, then publish Bài 2.
  await page.getByRole('button', { name: 'Ẩn với lớp: Bài học của Bài 2' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn với lớp' }).click();
  await expect(rows.nth(1).getByText('Đang ẩn', { exact: true })).toBeVisible();
  const l2 = await ok(gv, 'GET', `/lessons/${cur.lessons[1]!.id}`);
  await ok(gv, 'POST', `/lessons/${l2.id}/publish`, { expectedVersion: l2.version, itemIds: [] });
  const hvPage = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await signIn(hvPage, 'HV', hv.id);
  await hvPage.goto(`/hv/lop/${cls.id}`);
  const bai2 = hvPage.locator('.hv-list a.hv-row').filter({ hasText: 'Bài 2' });
  await expect(bai2).toContainText('Bài tập');
  await expect(bai2.locator('.hv-row__chips')).not.toContainText('Bài học');
  await shot(hvPage, 'TC-051', 2);

  // NFR-1: a curriculum of 50 Bài.
  const big = await seedCurriculum(gv, 'TC-051 50 bài', Array.from({ length: 50 }, (_, i) => ({ name: `B${i + 1}`, steps: 1 })));
  const c50 = await createClass(gv, { name: 'TC-051 50', curriculumId: big.id });
  const t0 = Date.now();
  await page.goto(`/gv/lop-hoc/${c50.id}?tab=noi-dung`);
  await expect(panel.getByText('50 bài · 0 phần đang ẩn với lớp này', { exact: true })).toBeVisible();
  await expect(rows).toHaveCount(50);
  const ms = Date.now() - t0;
  expect(ms).toBeLessThanOrEqual(2000);
  test.info().annotations.push({ type: 'NFR-1', description: `tab Nội dung with 50 Bài in ${ms} ms` });
});
