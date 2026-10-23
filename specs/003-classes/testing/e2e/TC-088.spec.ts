import { test, expect } from '@playwright/test';
import { addDays, apiAs, createClass, hvSubmit, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-26.3] TC-088 thông tin đã nhắc theo bộ cho 009, không hiện ở ô hạn, mất khi đổi hạn', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-088 GT', [{ name: 'Bài 1', sets: 2 }]);
  const [x, y] = cur.lessons[0]!.sets as [string, string];
  const today = vnDay();
  const an = await newStudent(gv, 'An Nộp X', { activate: true });
  const binh = await newStudent(gv, 'Bình Chưa', { activate: true });
  const cls = await createClass(gv, { name: 'TC-088 Lớp', curriculumId: cur.id, studentIds: [an.id, binh.id], startDate: addDays(today, -2) });
  await setDeadline(gv, cls.id, x, today);
  await setDeadline(gv, cls.id, y, today);
  expect((await hvSubmit(await apiAs('HV', an.id), cls.id, x)).status).toBe(200);
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });

  const info = await ok(gv, 'GET', `/classes/${cls.id}/reminders`);
  const byId = new Map(info.items.map((i: { setId: string }) => [i.setId, i]));
  expect((byId.get(x) as { count: number }).count).toBe(1);
  expect((byId.get(y) as { count: number }).count).toBe(2);
  expect(Date.parse((byId.get(x) as { remindedAt: string }).remindedAt)).toBeGreaterThan(Date.now() - 10 * 60_000);

  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  await expect(page.locator('.cls-dl-list')).not.toContainText(/nhắc|Đã gửi/i);
  await shot(page, 'TC-088', 1);

  await setDeadline(gv, cls.id, x, addDays(today, 2));
  const after = await ok(gv, 'GET', `/classes/${cls.id}/reminders`);
  expect(after.items.map((i: { setId: string }) => i.setId)).toEqual([y]);
});
