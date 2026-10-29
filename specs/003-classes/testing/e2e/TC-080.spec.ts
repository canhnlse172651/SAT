import { test, expect } from '@playwright/test';
import {
  addDays,
  apiAs,
  createClass,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  ok,
  outbox,
  seedCurriculum,
  setDeadline,
  vnDay,
} from './helpers';

test('[003:AC-24.1] [003:AC-24.2] [003:NFR-10] TC-080 lượt nhắc 08:00: đúng người, đúng bộ, một email mỗi lớp', async () => {
  test.setTimeout(120_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-080 GT', [{ name: 'Bài 1', sets: 3 }]);
  const [x, y, z] = cur.lessons[0]!.sets as [string, string, string];
  const today = vnDay();
  const an = await newStudent(gv, 'An Đã nộp', { activate: true });
  const binh = await newStudent(gv, 'Bình Chưa nộp', { activate: true });
  const chi = await newStudent(gv, 'Chi Đã khóa', { lock: true });
  const dung = await newStudent(gv, 'Dũng Chưa kích hoạt');
  const em = await newStudent(gv, 'Em Đã gỡ', { activate: true });
  const name = 'TC-080 Lớp';
  const cls = await createClass(gv, {
    name,
    curriculumId: cur.id,
    studentIds: [an.id, binh.id, chi.id, dung.id, em.id],
    startDate: addDays(today, -7),
  });
  await setDeadline(gv, cls.id, x, today);
  await setDeadline(gv, cls.id, y, today);
  await setDeadline(gv, cls.id, z, addDays(today, 1));
  expect((await hvSubmit(await apiAs('HV', an.id), cls.id, x)).status).toBe(200);
  await ok(gv, 'DELETE', `/classes/${cls.id}/students/${em.id}`);
  // Classes not active today: upcoming and ended, each with a set due today.
  const later = await seedCurriculum(gv, 'TC-080 GT2', [{ name: 'Bài 1', sets: 1 }]);
  const upcoming = await createClass(gv, { name: 'TC-080 Sắp', curriculumId: later.id, studentIds: [binh.id], startDate: addDays(today, 3) });
  await setDeadline(gv, upcoming.id, later.lessons[0]!.sets[0]!, today);
  const ended = await createClass(gv, { name: 'TC-080 Xong', curriculumId: later.id, studentIds: [binh.id] });
  await setDeadline(gv, ended.id, later.lessons[0]!.sets[0]!, today);
  await ok(gv, 'POST', `/classes/${ended.id}/end`);

  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });

  const forBinh = await outbox(gv, binh.email);
  expect(forBinh).toHaveLength(1);
  expect(forBinh[0].subject).toBe(`[SAT] Hôm nay là hạn nộp bài tập – ${name}`);
  expect(forBinh[0].text).toContain('Bài 1 · Bộ 1');
  expect(forBinh[0].text).toContain('Bài 1 · Bộ 2');
  expect(forBinh[0].text).not.toContain('Bài 1 · Bộ 3');
  const forAn = await outbox(gv, an.email);
  expect(forAn).toHaveLength(1);
  expect(forAn[0].text).toContain('Bài 1 · Bộ 2');
  expect(forAn[0].text).not.toContain('Bài 1 · Bộ 1');
  for (const s of [chi, dung, em]) expect(await outbox(gv, s.email)).toHaveLength(0);
});
