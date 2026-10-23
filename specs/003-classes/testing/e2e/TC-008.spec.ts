import { test, expect } from '@playwright/test';
import { apiAs, newStudent, newWorkspaceGv, ok, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-3.1] [003:AC-14.6] TC-008 bước 2 liệt kê HV của workspace, nhãn trạng thái, A→Z, 20/trang', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const gv = await newWorkspaceGv();
  const names: string[] = [];
  for (let i = 0; i < 22; i++) {
    const n = `HV ${String.fromCharCode(65 + i)} Mẫu`;
    names.push(n);
    await newStudent(gv, n, { activate: i % 2 === 0 });
  }
  await newStudent(gv, 'Zuy Chưa Kích Hoạt');
  await newStudent(gv, 'Zuy Gửi Lỗi', { activate: true, email: `fail+${Date.now()}@fail.invalid` });
  await newStudent(gv, 'Zuy Khóa', { activate: true, lock: true });
  // Another workspace's student (the seed GV's hv1) must not show.
  const other = await apiAs('GV');
  const foreign = (await ok(other, 'GET', '/students?q=hv1%40sat.dev')).items[0].displayName;

  await page.goto('/');
  await signInLike(page, gv);
  await page.goto('/gv/lop-hoc/tao-moi?buoc=1');
  await page.getByLabel('Tên lớp').fill('TC-008 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();

  const list = page.getByRole('group', { name: 'Học viên trong workspace' });
  const boxes = list.getByRole('checkbox');
  await expect(boxes).toHaveCount(20);
  await expect(boxes.first()).toHaveAccessibleName('HV A Mẫu');
  await expect(page.getByLabel('Tìm học viên')).toBeVisible();
  await expect(page.getByText('Sắp theo họ tên A→Z · 25 học viên · 20 mỗi trang')).toBeVisible();
  await expect(list.getByText(foreign, { exact: true })).toHaveCount(0);
  await expect(list.getByText('Chưa kích hoạt').first()).toBeVisible();
  await shot(page, 'TC-008', 1);

  await page.getByRole('navigation', { name: 'Phân trang' }).getByRole('button', { name: 'Trang 2' }).click();
  await expect(boxes).toHaveCount(5);
  const row = (n: string) => list.locator('.cls-pick-row').filter({ hasText: n });
  await expect(row('Zuy Chưa Kích Hoạt')).toContainText('Chưa kích hoạt');
  await expect(row('Zuy Gửi Lỗi')).toContainText('Gửi email thất bại');
  await expect(row('Zuy Khóa')).toContainText('Đã khóa');
  for (const n of ['Zuy Chưa Kích Hoạt', 'Zuy Gửi Lỗi', 'Zuy Khóa'])
    await expect(list.getByRole('checkbox', { name: n })).toBeEnabled();
  await expect(row('Zuy Khóa')).toContainText(/@sat\.dev/);
  await shot(page, 'TC-008', 2);
});
