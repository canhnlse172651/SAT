import { test, expect } from '@playwright/test';
import { addDays, apiAs, clockTo, createClass, newStudent, newWorkspaceGv, ok, outbox, resetClock, seedCurriculum, setDeadline, vnDay } from './helpers';

test('[003:AC-24.6] TC-083 sự cố lúc 08:00: gửi bù một lần trước 20:00, bỏ nếu sau 20:00', async () => {
  const gv0 = await newWorkspaceGv();
  const cur = await seedCurriculum(gv0, 'TC-083 GT', [{ name: 'Bài 1', sets: 2 }]);
  const [x, y] = cur.lessons[0]!.sets as [string, string];
  const today = vnDay();
  // Days nobody has swept yet on this server: two random days ahead (an earlier run may have swept fixed ones).
  const offset = 30 + Math.floor(Math.random() * 300);
  const dayA = addDays(today, offset);
  const dayB = addDays(today, offset + 1);
  const hv = await newStudent(gv0, 'Hùng Gửi bù', { activate: true });
  const cls = await createClass(gv0, { name: 'TC-083 Lớp', curriculumId: cur.id, studentIds: [hv.id], startDate: addDays(today, -3) });
  await setDeadline(gv0, cls.id, x, dayA);
  await setDeadline(gv0, cls.id, y, dayB);
  const me = await ok(gv0, 'GET', '/session');
  try {
    // The 08:00 sweep of day A did not run; the system is back at 11:00.
    await clockTo(gv0, dayA, '11:00');
    let gv = await apiAs('GV', me.user.id);
    const first = await ok(gv, 'POST', '/dev/classes/reminders/recover', {});
    expect(first.skipped).toBe(false);
    expect(await outbox(gv, hv.email)).toHaveLength(1);
    expect((await ok(gv, 'POST', '/dev/classes/reminders/recover', {})).skipped).toBe(true);
    expect(await outbox(gv, hv.email)).toHaveLength(1);

    // Day B: back only at 20:30 → that day's reminder is dropped.
    await clockTo(gv, dayB, '20:30');
    gv = await apiAs('GV', me.user.id);
    expect((await ok(gv, 'POST', '/dev/classes/reminders/recover', {})).skipped).toBe(true);
    expect(await outbox(gv, hv.email)).toHaveLength(1);
  } finally {
    await resetClock(await apiAs('GV', me.user.id));
  }
});
