import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, setVisibility, shot, signIn } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-13.8] [003:AC-17.8] TC-046 lối vào "Bài thi của lớp (N)" và ẩn phần không ảnh hưởng bài thi', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-046 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const hv = await newStudent(gv, 'Nga Thi', { activate: true });
  const cls = await createClass(gv, { name: 'TC-046 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  const none = await createClass(gv, { name: 'TC-046 Không thi', curriculumId: cur.id, studentIds: [hv.id] });
  await ok(gv, 'POST', '/dev/classes/exams', { classIds: [cls.id] });
  await ok(gv, 'POST', '/dev/classes/exams', { classIds: [cls.id] });
  await ok(gv, 'POST', '/dev/classes/exams', { classIds: [cls.id], visible: false });
  await signIn(page, 'HV', hv.id);

  await page.goto(`/hv/lop/${cls.id}`);
  const entry = page.getByRole('link', { name: /Bài thi của lớp \(2\)/ });
  await expect(entry).toBeVisible();
  await shot(page, 'TC-046', 1);
  await entry.click();
  await expect(page).toHaveURL(/\/hv\/bai-thi$/);
  await expect(page.getByRole('heading', { name: /S07 Bài thi/ })).toBeVisible();

  await setVisibility(gv, cls.id, true, { kind: 'column', section: 'lesson' });
  await setVisibility(gv, cls.id, true, { kind: 'column', section: 'exercise' });
  await page.goto(`/hv/lop/${cls.id}`);
  await expect(page.getByRole('link', { name: /Bài thi của lớp \(2\)/ })).toBeVisible();
  await shot(page, 'TC-046', 2);

  await page.goto(`/hv/lop/${none.id}`);
  await expect(page.getByRole('heading', { name: 'TC-046 Không thi' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Bài thi của lớp/ })).toHaveCount(0);
});
