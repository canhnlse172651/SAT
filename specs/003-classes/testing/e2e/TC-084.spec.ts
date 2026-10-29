import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newStudent, newWorkspaceGv, ok, outbox, seedCurriculum, setDeadline, shot, vnDay } from './helpers';

test('[003:AC-25.1] [003:AC-25.2] [003:AC-25.5] [003:NFR-6] TC-084 nội dung email nhắc, thứ tự bộ, người gửi, đọc được ở 360–430 px', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  // Curriculum order: Bài 1 (Bộ 1, Bộ 2), Bài 2 (Bộ 1); the deadline of Bài 2 is set first.
  const cur = await seedCurriculum(gv, 'TC-084 GT', [{ name: 'Bài 1', sets: 2 }, { name: 'Bài 2', sets: 1 }]);
  const today = vnDay();
  const binh = await newStudent(gv, 'Nguyễn Văn Bình', { activate: true });
  const other = await newStudent(gv, 'Bạn Khác', { activate: true });
  const name = 'TC-084 Lớp';
  const cls = await createClass(gv, { name, curriculumId: cur.id, studentIds: [binh.id, other.id], startDate: addDays(today, -3) });
  await setDeadline(gv, cls.id, cur.lessons[1]!.sets[0]!, today);
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[1]!, today);
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[0]!, today);
  await ok(gv, 'POST', '/dev/classes/reminders/run', { reset: true });

  const [mail] = await outbox(gv, binh.email);
  const day = ddmmyyyy(today);
  expect(mail.subject).toBe(`[SAT] Hôm nay là hạn nộp bài tập – ${name}`);
  expect(mail.fromName).toBe('SAT');
  const t = mail.text as string;
  const order = [
    'Chào Nguyễn Văn Bình,',
    `Hôm nay (${day}) là hạn nộp 3 bộ bài tập của lớp ${name} mà bạn chưa nộp:`,
    '- Bài 1 · Bộ 1',
    `  Bài 1 · Hạn nộp 23:59 ${day}`,
    '- Bài 1 · Bộ 2',
    '- Bài 2 · Bộ 1',
    `  Bài 2 · Hạn nộp 23:59 ${day}`,
    'Làm bài ngay:',
    'Liên kết mở bài tập (đăng nhập nếu cần). Bạn vẫn nộp được sau hạn; bài nộp sẽ được ghi “Nộp muộn”.',
    'Nếu bạn đã nộp bài, hãy bỏ qua thư này.',
    'Đây là thư tự động, vui lòng không trả lời.',
  ];
  let at = -1;
  for (const part of order) {
    const i = t.indexOf(part, at + 1);
    expect(i, part).toBeGreaterThan(at);
    at = i;
  }
  for (const secret of ['Bạn Khác', 'lan@sat.dev', 'điểm', 'Điểm', 'Đã hoàn thành']) expect(t).not.toContain(secret);
  // No score like "8/10" (dates dd/MM/yyyy aside).
  expect(t.replace(/\d\d\/\d\d\/\d{4}/g, '')).not.toMatch(/\d+\/\d+/);
  expect(mail.html).toContain('Làm bài ngay');

  for (const width of [360, 430]) {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(mail.html);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await shot(page, 'TC-084', width);
  }
});
