import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, uid } from './helpers';

test('[003:AC-8.9] TC-031 danh sách tab Tiến độ / Xếp hạng chỉ gồm HV đã kích hoạt (kể cả Đã khóa)', async () => {
  test.setTimeout(120_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-031 GT', [{ name: 'Bài 1', steps: 1 }]);
  const ids: string[] = [];
  for (let i = 0; i < 6; i++) ids.push((await newStudent(gv, `Kích hoạt ${i}`, { activate: true })).id);
  const p1 = await newStudent(gv, 'Chưa 1');
  ids.push(p1.id, (await newStudent(gv, 'Chưa 2')).id);
  ids.push((await newStudent(gv, 'Lỗi', { activate: true, email: `l+${uid()}@fail.invalid` })).id);
  ids.push((await newStudent(gv, 'Khóa', { lock: true })).id);
  const cls = await createClass(gv, { name: 'TC-031 Lớp', curriculumId: cur.id, studentIds: ids });

  const tracked = await ok(gv, 'GET', `/classes/${cls.id}/tracked-students`);
  expect(tracked.items).toHaveLength(7);
  expect(tracked.items.map((s: { displayName: string }) => s.displayName)).toContain('Khóa');
  expect((await ok(gv, 'GET', `/classes/${cls.id}`)).memberCount).toBe(10);

  await ok(gv, 'POST', `/students/${p1.id}/activate`, {});
  await expect
    .poll(async () => (await ok(gv, 'GET', `/classes/${cls.id}/tracked-students`)).items.length, { timeout: 20_000 })
    .toBe(8);
});
