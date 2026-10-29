import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmm, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-23.6] TC-078 lớp Đã kết thúc chỉ có nhãn Hạn nộp dd/MM', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-078 GT', [{ name: 'Bài 1', sets: 2 }]);
  const [x, y] = cur.lessons[0]!.sets as [string, string];
  const hv = await newStudent(gv, 'Ích Kết thúc', { activate: true });
  const today = vnDay();
  const cls = await createClass(gv, { name: 'TC-078 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(today, -10) });
  await setDeadline(gv, cls.id, x, addDays(today, -2));
  await setDeadline(gv, cls.id, y, today);
  await ok(gv, 'POST', `/classes/${cls.id}/end`);
  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  const list = page.getByRole('tabpanel');
  await expect(list).toContainText(`Hạn nộp ${ddmm(addDays(today, -2))}`);
  await expect(list).toContainText(`Hạn nộp ${ddmm(today)}`);
  await expect(list).not.toContainText('Hạn hôm nay');
  await expect(list).not.toContainText('Quá hạn');
  await shot(page, 'TC-078', 1);
});
