import { test, expect } from '@playwright/test';
import { apiAs, createClass, hvSubmit, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const LOCKED = 'Không thể đổi giáo trình vì học viên đã có bài nộp trong lớp này.';

test('[003:AC-9.3] [003:AC-9.4] TC-034 bài nộp đầu tiên giữa lúc mở hộp và lúc xác nhận chặn đổi giáo trình', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const g1 = await seedCurriculum(gv, 'G1 TC-034', [{ name: 'Bài 1', sets: 1 }]);
  await seedCurriculum(gv, 'G2 TC-034', [{ name: 'Bài 1', steps: 1 }]);
  const hv = await newStudent(gv, 'Vy Nộp', { activate: true });
  const cls = await createClass(gv, { name: 'TC-034 Lớp', curriculumId: g1.id, studentIds: [hv.id] });
  await setDeadline(gv, cls.id, g1.lessons[0]!.sets[0]!, vnDay());
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}`);

  await page.getByRole('tabpanel').getByRole('button', { name: 'Đổi giáo trình' }).click();
  const dlg = page.getByRole('dialog', { name: 'Đổi giáo trình' });
  await dlg.getByRole('radio', { name: /G2 TC-034/ }).click();
  await dlg.getByRole('button', { name: 'Đổi giáo trình' }).click();
  expect((await hvSubmit(await apiAs('HV', hv.id), cls.id, g1.lessons[0]!.sets[0]!)).status).toBe(200);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đổi giáo trình' }).click();
  await expect(page.getByText(LOCKED, { exact: true }).first()).toBeVisible();
  expect((await ok(gv, 'GET', `/classes/${cls.id}`)).curriculum.id).toBe(g1.id);
  await shot(page, 'TC-034', 1);

  await page.reload();
  const btn = page.getByRole('tabpanel').getByRole('button', { name: 'Đổi giáo trình' });
  await expect(btn).toBeDisabled();
  await expect(page.getByRole('tabpanel').getByText(LOCKED, { exact: true })).toBeVisible();
  await btn.click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Đổi giáo trình' })).toHaveCount(0);
  await shot(page, 'TC-034', 2);
});
