import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, asGv, ok, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-17.5] TC-070 bấm gửi nhiều lần chỉ thực hiện một lần', async ({ page }) => {
  const name = `TC-070 ${uid()}`;
  await asGv(page);
  await page.goto('/gv/giao-trinh');
  await page.getByRole('button', { name: 'Tạo giáo trình' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tạo giáo trình' });
  await dlg.getByLabel('Tên').fill(name);
  await dlg.getByRole('button', { name: 'HSK1', exact: true }).click();
  const create = dlg.getByRole('button', { name: 'Tạo giáo trình' });
  await create.dblclick();
  await expect(page).toHaveURL(/\/gv\/giao-trinh\/[0-9a-f]{24}$/);
  const list = await ok(page, 'GET', `/curricula?q=${encodeURIComponent(name)}`);
  expect(list.total).toBe(1);
  const cid = list.items[0].id;

  await page.getByRole('button', { name: 'Thêm bài' }).last().click();
  const add = page.getByRole('dialog', { name: 'Thêm bài' }).getByRole('button', { name: 'Thêm bài' });
  await add.dblclick();
  await expect(page).toHaveURL(/\/bai\/[0-9a-f]{24}$/);
  const detail = await ok(page, 'GET', `/curricula/${cid}`);
  expect(detail.lessons).toHaveLength(1);
  const lid = detail.lessons[0].id;
  await addItem(page, lid, 'lesson', { title: 'S', content: READY_STEP });

  await page.reload();
  await page.getByRole('button', { name: 'Xuất bản bài' }).click();
  const confirm = page.getByRole('dialog', { name: 'Xuất bản “Bài 1”' }).getByRole('button', { name: 'Xuất bản bài' });
  await confirm.dblclick();
  await expect(page.getByText('Đã xuất bản bài', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Dữ liệu đã thay đổi ở nơi khác. Vui lòng kiểm tra lại.')).toHaveCount(0);
  const published = await ok(page, 'GET', `/lessons/${lid}`);
  expect(published.version).toBe(2);
  await shot(page, 'TC-070', 1);

  await page.goto(`/gv/giao-trinh/${cid}`);
  await page.getByRole('button', { name: 'Thao tác với Bài 1' }).click();
  await page.getByRole('menuitem', { name: 'Nhân bản bài' }).dblclick();
  await expect(page).toHaveURL(/\/bai\/[0-9a-f]{24}$/);
  const after = await ok(page, 'GET', `/curricula/${cid}`);
  expect(after.lessons.map((l: { name: string }) => l.name)).toEqual(['Bài 1', 'Bài 1 (bản sao)']);
});
