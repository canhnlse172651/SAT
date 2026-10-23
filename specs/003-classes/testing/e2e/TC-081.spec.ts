import { test, expect } from '@playwright/test';
import { addDays, apiAs, createClass, hvSubmit, newStudent, newWorkspaceGv, ok, outbox, seedCurriculum, setDeadline, vnDay } from './helpers';

test('[003:AC-24.3] [003:AC-24.5] TC-081 sau lượt 08:00: hạn mới hôm nay, chạy lại, đổi qua lại, nộp bài — không có email mới', async () => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-081 GT', [{ name: 'Bài 1', sets: 3 }]);
  const [x, y, v] = cur.lessons[0]!.sets as [string, string, string];
  const today = vnDay();
  const binh = await newStudent(gv, 'Bình Nhắc', { activate: true });
  const cls = await createClass(gv, { name: 'TC-081 Lớp', curriculumId: cur.id, studentIds: [binh.id], startDate: addDays(today, -3) });
  await setDeadline(gv, cls.id, x, today);
  await setDeadline(gv, cls.id, y, today);
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  expect(await outbox(gv, binh.email)).toHaveLength(1);

  // After the sweep ("10:00"): a deadline set to today, a re-run, X moved away and back, Bình submits Y.
  await setDeadline(gv, cls.id, v, today);
  const rerun = await ok(gv, 'POST', '/dev/classes/reminders/run', {});
  expect(rerun.skipped).toBe(true);
  await setDeadline(gv, cls.id, x, addDays(today, 1));
  await setDeadline(gv, cls.id, x, today);
  expect((await hvSubmit(await apiAs('HV', binh.id), cls.id, y)).status).toBe(200);
  await ok(gv, 'POST', '/dev/classes/reminders/run', {});
  // Even a forced second sweep of the same day sends nothing more for this class (one per HV per class per day).
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  const mails = await outbox(gv, binh.email);
  expect(mails).toHaveLength(1);
  expect(mails[0].text).not.toContain('Bài 1 · Bộ 3');
});
