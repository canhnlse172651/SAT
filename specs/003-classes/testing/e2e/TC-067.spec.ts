import { test, expect } from '@playwright/test';
import { apiAs, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, uid } from './helpers';

test('[003:AC-20.3] [003:AC-20.4] [003:NFR-7] TC-067 danh sách Thành viên: ai được liệt kê, chỉ họ tên + ảnh', async () => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-067 GT', [{ name: 'Bài 1', steps: 1 }]);
  const me = await newStudent(gv, 'Tôi', { activate: true });
  const locked = await newStudent(gv, 'Khóa', { lock: true });
  const failed = await newStudent(gv, 'Lỗi', { activate: true, email: `l+${uid()}@fail.invalid` });
  const removed = await newStudent(gv, 'Đã gỡ', { activate: true });
  const deleted = await newStudent(gv, 'Đã xóa', { activate: true });
  const cls = await createClass(gv, {
    name: 'TC-067 Lớp',
    curriculumId: cur.id,
    studentIds: [me.id, locked.id, failed.id, removed.id, deleted.id],
  });
  await ok(gv, 'DELETE', `/classes/${cls.id}/students/${removed.id}`);
  await ok(gv, 'DELETE', `/students/${deleted.id}`);

  const res = await ok(await apiAs('HV', me.id), 'GET', `/my-classes/${cls.id}/members`);
  expect(res.items.map((m: { displayName: string }) => m.displayName)).toEqual(['Tôi', 'Khóa']);
  for (const m of res.items) expect(Object.keys(m).sort()).toEqual(['avatarUrl', 'displayName', 'id', 'me']);
  const text = JSON.stringify(res);
  for (const word of ['@', 'status', 'locked', 'joinedAt', 'phone', 'score', 'progress']) expect(text).not.toContain(word);
});
