import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { addDays, call, createClass, newStudent, newWorkspaceGv, ok, outbox, seedCurriculum, setDeadline, uid, vnDay } from './helpers';

test('[003:AC-26.1] [003:AC-26.2] TC-087 thư nhắc bị từ chối / không nhận: không gửi lại, trạng thái giữ, ghi nhật ký; không bị giới hạn 001 chặn', async () => {
  test.setTimeout(120_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-087 GT', [{ name: 'Bài 1', sets: 1 }]);
  const today = vnDay();
  const ok1 = await newStudent(gv, 'Nhận Bình thường', { activate: true });
  const rej = await newStudent(gv, 'Bị Từ chối', { activate: true });
  const bnc = await newStudent(gv, 'Không Nhận', { activate: true });
  // Change the e-mails after activation (the status stays "Đã kích hoạt").
  const rejEmail = `reject@${uid()}.invalid`;
  const bncEmail = `bounce@${uid()}.invalid`;
  await ok(gv, 'PATCH', `/students/${rej.id}`, { displayName: rej.displayName, email: rejEmail });
  await ok(gv, 'PATCH', `/students/${bnc.id}`, { displayName: bnc.displayName, email: bncEmail });
  for (const s of [rej, bnc]) expect((await ok(gv, 'GET', `/students/${s.id}`)).status).toBe('active');
  // 001's password-mail limit used up for the normal student.
  // (each password e-mail must finish sending before the next one can be asked for.)
  let limited = false;
  for (let i = 0; i < 10 && !limited; i++) {
    const r = await call(gv, 'POST', `/students/${ok1.id}/reset-password`, {});
    limited = r.status === 429;
    if (!limited)
      await expect
        .poll(async () => (await ok(gv, 'GET', `/students/${ok1.id}`)).status, { timeout: 20_000 })
        .toBe('active');
  }
  expect(limited).toBe(true);

  const cls = await createClass(gv, {
    name: 'TC-087 Lớp',
    curriculumId: cur.id,
    studentIds: [ok1.id, rej.id, bnc.id],
    startDate: addDays(today, -2),
  });
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[0]!, today);
  const run = await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  expect(run.failed).toBeGreaterThanOrEqual(1);
  expect(await outbox(gv, ok1.email)).toHaveLength(1);
  await new Promise((r) => setTimeout(r, 2500)); // the dev provider reports the bounce after 1 s
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });
  expect(await outbox(gv, rejEmail)).toHaveLength(0);
  expect((await outbox(gv, bncEmail)).length).toBeLessThanOrEqual(1);
  for (const s of [rej, bnc]) expect((await ok(gv, 'GET', `/students/${s.id}`)).status).toBe('active');

  const log = process.env.QA_SERVER_LOG;
  if (log) {
    const lines = readFileSync(log, 'utf8').split('\n').filter((l) => l.includes('"reminder.send"') && l.includes('"failed"'));
    expect(lines.some((l) => l.includes('"reason":"rejected"'))).toBe(true);
    for (const l of lines) for (const pii of [rejEmail, rej.displayName]) expect(l).not.toContain(pii);
  }
});
