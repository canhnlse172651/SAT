import { test, expect } from '@playwright/test';
import { addDays, apiAs, clockTo, createClass, newStudent, newWorkspaceGv, ok, outbox, resetClock, seedCurriculum, setDeadline, vnDay } from './helpers';

test('[003:AC-24.4] TC-082 dời hạn sang ngày mai: nhắc lại lúc 08:00 ngày mới', async () => {
  const gv0 = await newWorkspaceGv();
  const cur = await seedCurriculum(gv0, 'TC-082 GT', [{ name: 'Bài 1', sets: 1 }]);
  const x = cur.lessons[0]!.sets[0]!;
  const today = vnDay();
  const tomorrow = addDays(today, 1);
  const binh = await newStudent(gv0, 'Bình Dời', { activate: true });
  const cls = await createClass(gv0, { name: 'TC-082 Lớp', curriculumId: cur.id, studentIds: [binh.id], startDate: addDays(today, -3) });
  await setDeadline(gv0, cls.id, x, today);
  await ok(gv0, 'POST', '/dev/classes/reminders/run', { reset: true });
  expect(await outbox(gv0, binh.email)).toHaveLength(1);
  await setDeadline(gv0, cls.id, x, tomorrow);
  const me = await ok(gv0, 'GET', '/session');

  await clockTo(gv0, tomorrow, '08:00');
  try {
    const gv = await apiAs('GV', me.user.id);
    // `reset`: the 08:00 sweep of the new day, even if an earlier run on this server already swept that day.
    await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
    const mails = await outbox(gv, binh.email);
    expect(mails).toHaveLength(2);
    expect(mails[0].text).toContain('Bài 1 · Bộ 1');
    expect(mails[0].text).toContain(`Hôm nay (${tomorrow.slice(8, 10)}/${tomorrow.slice(5, 7)}/${tomorrow.slice(0, 4)})`);
  } finally {
    await resetClock(await apiAs('GV', me.user.id));
  }
});
