import { test, expect } from '@playwright/test';
import { createCurriculum, registerGv, shot } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-3.2] [002:AC-3.3] [002:AC-3.5] TC-007 lọc cấp độ giữ trong phiên, tìm không dấu, không khớp', async ({ page }) => {
  await page.goto('/');
  await registerGv(page);
  await createCurriculum(page, 'Giáo trình HSK1 cơ bản', 1);
  await createCurriculum(page, 'Luyện nǐ hǎo', 1);
  await createCurriculum(page, 'Ngữ pháp HSK2', 2);
  await page.goto('/gv/giao-trinh');
  const cards = page.getByRole('list', { name: 'Danh sách giáo trình' }).getByRole('listitem');
  await expect(cards).toHaveCount(3);

  const filters = page.getByRole('group', { name: 'Lọc theo cấp HSK' });
  await filters.getByRole('button', { name: /^HSK1\b/ }).click();
  await expect(cards).toHaveCount(2);

  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Tài khoản' }).click();
  await expect(page).toHaveURL(/\/gv\/tai-khoan$/);
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Giáo trình' }).click();
  await expect(filters.getByRole('button', { name: /^HSK1\b/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(2);

  const search = page.getByLabel('Tìm giáo trình');
  await search.fill('giao trinh');
  await expect(cards).toHaveCount(1);
  await expect(cards.first().getByRole('link')).toHaveText('Giáo trình HSK1 cơ bản');

  await search.fill('ni hao');
  await expect(cards).toHaveCount(1);
  await expect(cards.first().getByRole('link')).toHaveText('Luyện nǐ hǎo');

  await search.fill('zzz');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy giáo trình phù hợp' })).toBeVisible();
  await shot(page, 'TC-007', 1);
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect(cards).toHaveCount(3);
  await expect(filters.getByRole('button', { name: /^Tất cả / })).toHaveAttribute('aria-pressed', 'true');
  await expect(search).toHaveValue('');
});
