import { test, expect } from '@playwright/test';
import { asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-5.1] [002:AC-5.2] [002:AC-7.1] TC-018 thêm bài, T18 mở với 2 panel', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-018 ${uid()}`, 1);
  await page.goto(`/gv/giao-trinh/${c.id}`);

  await page.getByRole('button', { name: 'Thêm bài' }).last().click();
  let dlg = page.getByRole('dialog', { name: 'Thêm bài' });
  await expect(dlg.getByLabel('Tên bài')).toHaveValue('Bài 1');
  await expect(dlg.getByLabel('Tên bài')).toBeEditable();
  await dlg.getByRole('button', { name: 'Thêm bài' }).click();
  await expect(page.getByText('Đã thêm bài', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/bai\/[0-9a-f]{24}$/);

  const crumbs = page.getByRole('navigation', { name: 'Đường dẫn' });
  await expect(crumbs.getByRole('link', { name: c.name })).toBeVisible();
  const head = page.getByRole('heading', { level: 1 });
  await expect(head).toContainText('Bài 1');
  await expect(head).toContainText('Nháp');
  const manual = page.getByRole('region', { name: 'Thủ công' });
  const ai = page.getByRole('region', { name: 'Tạo bằng AI' });
  await expect(manual).toBeVisible();
  await expect(ai).toBeVisible();
  const [m, a] = [await manual.boundingBox(), await ai.boundingBox()];
  expect(a!.x).toBeGreaterThan(m!.x + m!.width - 1); // side by side: AI panel on the right
  expect(Math.abs(a!.y - m!.y)).toBeLessThan(5);
  await expect(manual.getByText('Chưa có bước học nào')).toBeVisible();
  await expect(manual.getByText('Chưa có bộ bài tập nào')).toBeVisible();
  await shot(page, 'TC-018', 1);

  // Back to T06 on a slow network (the curriculum detail answers after 1.5 s) and "Thêm bài" right away,
  // as a GV does: the pre-filled name must count the Bài that now exists.
  await page.route(`**/api/curricula/${c.id}`, async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await crumbs.getByRole('link', { name: c.name }).click();
  await page.getByRole('button', { name: 'Thêm bài' }).first().click();
  await page.waitForTimeout(2000);
  await shot(page, 'TC-018', 2);
  await page.unroute(`**/api/curricula/${c.id}`);
  dlg = page.getByRole('dialog', { name: 'Thêm bài' });
  await expect(dlg.getByLabel('Tên bài')).toHaveValue('Bài 2');
  await dlg.getByRole('button', { name: 'Thêm bài' }).click();
  await expect(page).toHaveURL(/\/bai\/[0-9a-f]{24}$/);
  await page.goBack();
  await expect(lessonRow(page, 'Bài 2')).toBeVisible();
  await expect(page.locator('.cur-row__name')).toHaveText(['Bài 1', 'Bài 2']);
});
