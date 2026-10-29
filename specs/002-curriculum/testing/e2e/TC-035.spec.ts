import { test, expect } from '@playwright/test';
import { addItem, addLesson, asGv, createCurriculum, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-9.5] [002:AC-9.3] TC-035 không có mục sẵn sàng thì không xuất bản được bài', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-035 ${uid()}`, 1);
  const l = await addLesson(page, c.id, 'Bài 1');
  await addItem(page, l.id, 'lesson');
  await page.goto(`/gv/giao-trinh/${c.id}/bai/${l.id}`);
  await page.getByRole('button', { name: 'Xuất bản bài' }).click();
  const dlg = page.getByRole('dialog', { name: 'Xuất bản “Bài 1”' });
  await expect(dlg.getByRole('button', { name: 'Xuất bản bài' })).toBeDisabled();
  await expect(dlg.getByText('Cần ít nhất một mục sẵn sàng để xuất bản bài', { exact: true })).toBeVisible();
  await expect(dlg.getByText(/Bài sẽ hiển thị với học viên/)).toHaveCount(0);
  await shot(page, 'TC-035', 1);
});
