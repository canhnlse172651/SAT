import { test, expect } from '@playwright/test';
import { addDays, createClass, newStudent, newWorkspaceGv, ok, outbox, seedCurriculum, vnDay } from './helpers';

test('[003:AC-25.3] TC-085 hơn 20 bộ: liệt kê 20 bộ đầu và "Và {M} bài tập khác cũng hết hạn hôm nay."', async () => {
  test.setTimeout(180_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-085 GT', [{ name: 'Bài 1', sets: 23 }]);
  const today = vnDay();
  const hv = await newStudent(gv, 'Lợi Nhiều bộ', { activate: true });
  const cls = await createClass(gv, { name: 'TC-085 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(today, -3) });
  await ok(gv, 'PUT', `/classes/${cls.id}/deadlines`, { target: { lessonId: cur.lessons[0]!.id }, date: today });
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  const [mail] = await outbox(gv, hv.email);
  const t = mail.text as string;
  expect(t).toContain('là hạn nộp 23 bộ bài tập');
  expect((t.match(/^- /gm) ?? []).length).toBe(20);
  expect(t).toContain('- Bài 1 · Bộ 20');
  expect(t).not.toContain('- Bài 1 · Bộ 21');
  const note = t.indexOf('Và 3 bài tập khác cũng hết hạn hôm nay.');
  expect(note).toBeGreaterThan(t.indexOf('- Bài 1 · Bộ 20'));
  expect(note).toBeLessThan(t.indexOf('Làm bài ngay:'));
});
