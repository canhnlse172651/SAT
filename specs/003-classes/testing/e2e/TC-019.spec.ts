import { test, expect, type Page } from '@playwright/test';
import { apiAs, newStudent, ok, seedCurriculum, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

async function fillWizard(page: Page, name: string, students: string[], curriculum: string) {
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill(name);
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  for (const s of students) {
    await page.getByLabel('Tìm học viên').fill(s);
    await page.getByRole('checkbox', { name: s }).check();
  }
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByLabel('Tìm giáo trình').fill(curriculum);
  await page.getByRole('radio', { name: new RegExp(curriculum) }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
}

test('[003:AC-5.4] TC-019 dữ liệu không còn hợp lệ khi bấm Tạo lớp: về bước sớm nhất có lỗi', async ({
  page,
  browser,
}) => {
  const gv = await apiAs('GV');
  const tag = uid();
  const g = await seedCurriculum(gv, `TC-019 G ${tag}`, [{ name: 'Bài 1', steps: 1 }]);
  const g2 = await seedCurriculum(gv, `TC-019 G2 ${tag}`, [{ name: 'Bài 1', steps: 1 }]);
  const p = await newStudent(gv, `TC019 P ${tag}`);
  const name = `TC-019 Lớp ${tag}`;
  await signIn(page, 'GV');
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageB = await ctxB.newPage();
  await signIn(pageB, 'GV');
  await fillWizard(page, name, [], g.name);
  await fillWizard(pageB, name, [p.displayName], g.name);

  await page.getByRole('button', { name: 'Tạo lớp' }).click();
  await expect(page).toHaveURL(/\/gv\/lop-hoc\/[0-9a-f]{24}$/);
  await pageB.getByRole('button', { name: 'Tạo lớp' }).click();
  await expect(pageB.getByText('Bước 1/4 · Thông tin lớp', { exact: true })).toBeVisible();
  await expect(pageB.getByText('Tên lớp đã tồn tại', { exact: true })).toBeVisible();
  await shot(pageB, 'TC-019', 1);

  await pageB.getByLabel('Tên lớp').fill(`${name} B`);
  await ok(gv, 'POST', `/curricula/${g.id}/archive`);
  await pageB.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await pageB.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await pageB.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await pageB.getByRole('button', { name: 'Tạo lớp' }).click();
  await expect(pageB.getByText('Bước 3/4 · Chọn giáo trình', { exact: true })).toBeVisible();
  await expect(
    pageB.getByText('Giáo trình đã chọn không còn khả dụng. Vui lòng chọn giáo trình khác.', { exact: true }),
  ).toBeVisible();
  await shot(pageB, 'TC-019', 2);

  await pageB.getByLabel('Tìm giáo trình').fill(g2.name);
  await pageB.getByRole('radio', { name: new RegExp(g2.name) }).click();
  await ok(gv, 'DELETE', `/students/${p.id}`);
  await pageB.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await pageB.getByRole('button', { name: 'Tạo lớp' }).click();
  await expect(pageB.getByText('Bước 2/4 · Thêm học viên', { exact: true })).toBeVisible();
  await expect(
    pageB.getByText('1 học viên đã bị xóa khỏi workspace và đã được bỏ chọn', { exact: true }),
  ).toBeVisible();
  await expect(pageB.getByRole('heading', { name: 'Đã chọn (0)' })).toBeVisible();
  await pageB.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(pageB.getByRole('radio', { name: new RegExp(g2.name) })).toHaveAttribute('aria-checked', 'true');
  await pageB.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await expect(pageB.locator('.cls-wiz-wide')).toContainText(`${name} B`);
  await shot(pageB, 'TC-019', 3);
});
