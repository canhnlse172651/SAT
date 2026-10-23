import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, seedCurriculum, shot, signIn } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-20.6] TC-068 thành viên duy nhất: Lớp chưa có thành viên nào khác.', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-068 GT', [{ name: 'Bài 1', steps: 1 }]);
  const me = await newStudent(gv, 'Một Mình', { activate: true });
  const pending = await newStudent(gv, 'Chưa Vào');
  const cls = await createClass(gv, { name: 'TC-068 Lớp', curriculumId: cur.id, studentIds: [me.id, pending.id] });
  await signIn(page, 'HV', me.id);
  await page.goto(`/hv/lop/${cls.id}`);
  await page.getByRole('button', { name: /Thành viên \(1\)/ }).click();
  const rows = page.locator('.hv-list a.hv-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText('Một Mình');
  await expect(rows.nth(0)).toContainText('Bạn');
  await expect(page.getByText('Lớp chưa có thành viên nào khác.', { exact: true })).toBeVisible();
  await shot(page, 'TC-068', 1);
});
