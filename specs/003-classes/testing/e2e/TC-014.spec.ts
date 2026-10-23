import { test, expect, type Page } from '@playwright/test';
import { createClass, newWorkspaceGv, ok, seedCurriculum, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

async function toStep3(page: Page) {
  await page.goto('/gv/lop-hoc/tao-moi');
  await page.getByLabel('Tên lớp').fill('TC-014 Lớp');
  await page.getByRole('button', { name: 'Chọn ngày' }).click();
  await page.locator('button[aria-current="date"]').click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
  await page.getByRole('button', { name: 'Tiếp tục ›' }).click();
}

test('[003:AC-4.1] [003:AC-4.2] TC-014 bước 3: danh sách, thứ tự HSK rồi tên, lọc HSK + từ khóa', async ({ page }) => {
  const gv = await newWorkspaceGv();
  await seedCurriculum(gv, 'B HSK2', [], 2);
  const a = await seedCurriculum(gv, 'A HSK2', [{ name: 'Bài 1', steps: 1 }, { name: 'Bài 2', steps: 1 }], 2);
  await seedCurriculum(gv, 'C HSK1', [], 1);
  const archived = await seedCurriculum(gv, 'D lưu trữ', [], 1);
  await ok(gv, 'POST', `/curricula/${archived.id}/archive`);
  await createClass(gv, { name: 'Lớp dùng A', curriculumId: a.id });
  await signInLike(page, gv);
  await toStep3(page);

  const radios = page.getByRole('radiogroup', { name: 'Giáo trình' }).getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(radios.nth(0)).toContainText('C HSK1');
  await expect(radios.nth(1)).toContainText('A HSK2');
  await expect(radios.nth(2)).toContainText('B HSK2');
  await expect(radios.nth(1)).toContainText('HSK2');
  await expect(radios.nth(1)).toContainText('2 bài đã xuất bản');
  await expect(radios.nth(1)).toContainText('Dùng bởi 1 lớp');
  await expect(page.getByText('D lưu trữ')).toHaveCount(0);
  await shot(page, 'TC-014', 1);

  const filter = page.getByRole('group', { name: 'Lọc theo cấp HSK' });
  await filter.getByRole('button', { name: /^HSK2/ }).click();
  await expect(radios).toHaveCount(2);
  await expect(radios.nth(0)).toContainText('A HSK2');
  await page.getByLabel('Tìm giáo trình').fill('a');
  await expect(radios).toHaveCount(1);
  await expect(radios.nth(0)).toContainText('A HSK2');
  await page.getByLabel('Tìm giáo trình').fill('zzz');
  await expect(page.getByText('Không có giáo trình phù hợp', { exact: true })).toBeVisible();
  await shot(page, 'TC-014', 2);
});
