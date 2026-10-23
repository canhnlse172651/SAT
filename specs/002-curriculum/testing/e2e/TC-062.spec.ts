import { test, expect } from '@playwright/test';
import { addLesson, asGv, call, createCurriculum, ok, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-15.6] [002:AC-17.5] TC-062 đang nhân bản: thông báo, không nhận thêm yêu cầu', async ({ page }) => {
  const name = `TC-062 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 1);
  await addLesson(page, c.id, 'Bài 1');
  await addLesson(page, c.id, 'Bài 2');
  await ok(page, 'POST', '/dev/curriculum/faults', { op: 'duplicate-curriculum', delayMs: 3000 });

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await page.getByRole('button', { name: 'Nhân bản', exact: true }).click();
  const dlg = page.getByRole('dialog', { name: 'Nhân bản giáo trình' });
  await expect(dlg.getByLabel('Tên')).toHaveValue(`${name} (bản sao)`);
  const submit = dlg.getByRole('button', { name: 'Nhân bản' });
  await submit.click();
  const busy = dlg.getByRole('button', { name: 'Đang nhân bản…' });
  await expect(busy).toBeVisible();
  await expect(busy).toBeDisabled();
  await busy.click({ force: true });
  await busy.click({ force: true });
  await shot(page, 'TC-062', 1);

  const again = await call(page, 'POST', `/curricula/${c.id}/duplicate`, { name: `${name} khác`, hsk: 1 });
  expect(again.status).toBe(409);
  expect(again.body.error.message).toBe('Đang nhân bản…');

  await expect(page.getByText('Đã nhân bản giáo trình', { exact: true })).toBeVisible({ timeout: 15_000 });
  const list = await ok(page, 'GET', `/curricula?q=${encodeURIComponent(name)}`);
  expect(list.items.map((x: { name: string }) => x.name).sort()).toEqual([name, `${name} (bản sao)`].sort());
});
