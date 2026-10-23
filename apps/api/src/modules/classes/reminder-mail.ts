import { CLASS_LIMITS, type MailContent, formatDay } from '@sat/shared';
import { MAIL_FOOTER } from '../accounts/account-mail.templates.js';

export interface ReminderMailInput {
  studentName: string;
  className: string;
  /** The deadline day (today). */
  date: string;
  /** Due sets not submitted, in curriculum order (AC-25.2). */
  sets: { title: string; lesson: string }[];
  /** S05 of the only set, or S02 of the class (AC-25.4). */
  url: string;
}

/** AC-25.1, AC-25.3, AC-25.5: the Vietnamese reminder; nothing about scores, other students or the teacher. */
export function reminderMail(m: ReminderMailInput): MailContent {
  const day = formatDay(m.date);
  const listed = m.sets.slice(0, CLASS_LIMITS.reminderItems);
  const more = m.sets.length - listed.length;
  return {
    subject: `[SAT] Hôm nay là hạn nộp bài tập – ${m.className}`,
    paragraphs: [
      `Chào ${m.studentName},`,
      `Hôm nay (${day}) là hạn nộp ${m.sets.length} bộ bài tập của lớp ${m.className} mà bạn chưa nộp:`,
    ],
    credentials: [],
    items: listed.map((s) => ({ title: s.title, detail: `${s.lesson} · Hạn nộp 23:59 ${day}` })),
    ...(more > 0 ? { note: `Và ${more} bài tập khác cũng hết hạn hôm nay.` } : {}),
    button: { label: 'Làm bài ngay', href: m.url },
    after: [
      'Liên kết mở bài tập (đăng nhập nếu cần). Bạn vẫn nộp được sau hạn; bài nộp sẽ được ghi “Nộp muộn”.',
      'Nếu bạn đã nộp bài, hãy bỏ qua thư này.',
    ],
    footer: MAIL_FOOTER,
  };
}
