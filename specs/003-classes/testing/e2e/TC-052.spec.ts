import { test, expect } from '@playwright/test';
import { createClass, newWorkspaceGv, seedCurriculum, shot, signInLike } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-15.4] TC-052 tab Nội dung khi giáo trình chưa có Bài', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'G rỗng', []);
  const cls = await createClass(gv, { name: 'TC-052 Lớp', curriculumId: cur.id });
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  await expect(page.getByText('Giáo trình «G rỗng» chưa có bài nào.', { exact: true })).toBeVisible();
  await shot(page, 'TC-052', 1);
  await page.getByRole('tabpanel').getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`/gv/giao-trinh/${cur.id}$`));
});
