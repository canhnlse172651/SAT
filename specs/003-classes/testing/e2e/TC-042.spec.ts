import { test, expect } from '@playwright/test';
import { newStudent, newWorkspaceGv, shot, signIn } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-12.3] TC-042 S01 khi HV chưa thuộc lớp nào', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const hv = await newStudent(gv, 'Lẻ Loi', { activate: true });
  await signIn(page, 'HV', hv.id);
  await page.goto('/hv');
  await expect(
    page.getByText('Bạn chưa được thêm vào lớp nào. Hãy liên hệ giáo viên của bạn.', { exact: true }),
  ).toBeVisible();
  await shot(page, 'TC-042', 1);
});
