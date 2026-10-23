import { test, expect } from '@playwright/test';
import { asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-15.1] TC-060 hộp nhân bản giáo trình điền sẵn tên và cấp độ', async ({ page }) => {
  const name = `TC-060 ${uid()}`;
  await asGv(page);
  const c = await createCurriculum(page, name, 2);
  await createCurriculum(page, `${name} (bản sao)`, 2);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await page.getByRole('button', { name: 'Nhân bản', exact: true }).click();
  const dlg = page.getByRole('dialog', { name: 'Nhân bản giáo trình' });
  await expect(dlg.getByLabel('Tên')).toHaveValue(`${name} (bản sao 2)`);
  await expect(dlg.getByRole('button', { name: 'HSK2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(dlg.getByLabel('Tên')).toBeEditable();
  await shot(page, 'TC-060', 1);
  await dlg.getByLabel('Tên').fill('');
  await dlg.getByRole('button', { name: 'Nhân bản' }).click();
  await expect(dlg.getByText('Vui lòng nhập tên giáo trình', { exact: true })).toBeVisible();
  await dlg.getByRole('button', { name: 'HSK5', exact: true }).click();
  await expect(dlg.getByRole('button', { name: 'HSK5', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
