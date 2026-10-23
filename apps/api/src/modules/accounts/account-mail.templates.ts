import type { MailContent } from '@sat/shared';

/* REQ-17: every e-mail of module 001, in Vietnamese, sender "SAT", same closing line (AC-17.4). */

export const MAIL_FROM_NAME = 'SAT';
export const MAIL_FOOTER = 'Đây là thư tự động, vui lòng không trả lời.';
/** Shown instead of the password in the T11 preview (AC-17.6). */
export const MASKED_PASSWORD = '••••••••••';

interface StudentMailInput {
  studentName: string;
  teacherName: string;
  email: string;
  password: string;
  loginUrl: string;
}

/** AC-17.1 */
export const activationMail = (m: StudentMailInput): MailContent => ({
  subject: '[SAT] Tài khoản học tập của bạn đã sẵn sàng',
  paragraphs: [
    `Chào ${m.studentName},`,
    `Giáo viên ${m.teacherName} đã tạo cho bạn một tài khoản học tập trên SAT.`,
  ],
  credentials: [
    { label: 'Email đăng nhập', value: m.email },
    { label: 'Mật khẩu', value: m.password },
  ],
  items: [],
  button: { label: 'Đăng nhập', href: m.loginUrl },
  after: [
    'Bạn có thể đổi mật khẩu bất kỳ lúc nào trong mục Hồ sơ của tôi.',
    'Nếu bạn không biết giáo viên này, hãy bỏ qua thư này.',
  ],
  footer: MAIL_FOOTER,
});

/** AC-17.2 */
export const newPasswordMail = (m: StudentMailInput): MailContent => ({
  subject: '[SAT] Mật khẩu mới cho tài khoản của bạn',
  paragraphs: [
    `Chào ${m.studentName},`,
    `Giáo viên ${m.teacherName} đã đặt lại mật khẩu tài khoản SAT của bạn. Mật khẩu cũ không còn dùng được.`,
  ],
  credentials: [
    { label: 'Email đăng nhập', value: m.email },
    { label: 'Mật khẩu mới', value: m.password },
  ],
  items: [],
  button: { label: 'Đăng nhập', href: m.loginUrl },
  after: ['Nếu bạn không đề nghị đặt lại mật khẩu, hãy liên hệ giáo viên của bạn.'],
  footer: MAIL_FOOTER,
});

/** AC-17.3 */
export const teacherResetMail = (m: { teacherName: string; resetUrl: string }): MailContent => ({
  subject: '[SAT] Đặt lại mật khẩu của bạn',
  paragraphs: [
    `Chào ${m.teacherName},`,
    'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản giáo viên SAT của bạn.',
  ],
  credentials: [],
  items: [],
  button: { label: 'Đặt lại mật khẩu', href: m.resetUrl },
  after: [
    'Liên kết có hiệu lực trong 60 phút và chỉ dùng được một lần.',
    'Nếu bạn không yêu cầu, hãy bỏ qua thư này. Mật khẩu của bạn sẽ không thay đổi.',
  ],
  footer: MAIL_FOOTER,
});

/** AC-17.5: the deadline reminder of module 003 (content per 003 AC-25.1), as a preview sample. */
export const deadlineReminderSample = (m: {
  studentName: string;
  className: string;
  date: string;
  sets: { title: string; lesson: string }[];
  url: string;
}): MailContent => ({
  subject: `[SAT] Hôm nay là hạn nộp bài tập – ${m.className}`,
  paragraphs: [
    `Chào ${m.studentName},`,
    `Hôm nay (${m.date}) là hạn nộp ${m.sets.length} bộ bài tập của lớp ${m.className} mà bạn chưa nộp:`,
  ],
  credentials: [],
  items: m.sets.map((s) => ({ title: s.title, detail: `${s.lesson} · Hạn nộp 23:59 ${m.date}` })),
  button: { label: 'Làm bài ngay', href: m.url },
  after: [
    'Liên kết mở bài tập (đăng nhập nếu cần). Bạn vẫn nộp được sau hạn; bài nộp sẽ được ghi “Nộp muộn”.',
    'Nếu bạn đã nộp bài, hãy bỏ qua thư này.',
  ],
  footer: MAIL_FOOTER,
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Plain text and a narrow, single-column HTML version (readable at 360 px — NFR-8). */
export function renderMail(content: MailContent): { subject: string; text: string; html: string } {
  const text = [
    ...content.paragraphs,
    '',
    ...content.items.flatMap((i) => [`- ${i.title}`, `  ${i.detail}`]),
    ...content.credentials.map((c) => `${c.label}: ${c.value}`),
    '',
    ...(content.button ? [`${content.button.label}: ${content.button.href}`, ''] : []),
    ...content.after,
    '',
    content.footer,
  ].join('\n');

  const p = (s: string) => `<p style="margin:0 0 12px">${esc(s)}</p>`;
  const html = `<!doctype html><html lang="vi"><body style="margin:0;padding:16px;background:#f5f6f8">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:20px;font:15px/1.5 Arial,sans-serif;color:#1d2433;word-wrap:break-word">
${content.paragraphs.map(p).join('\n')}
${content.items.length ? `<ul style="padding-left:20px;margin:0 0 12px">${content.items.map((i) => `<li><b>${esc(i.title)}</b><br>${esc(i.detail)}</li>`).join('')}</ul>` : ''}
${content.credentials.length ? `<div style="background:#f5f6f8;border-radius:6px;padding:12px;margin:0 0 12px">${content.credentials.map((c) => `<div>${esc(c.label)}: <b style="font-family:monospace">${esc(c.value)}</b></div>`).join('')}</div>` : ''}
${content.button ? `<p style="margin:0 0 16px"><a href="${esc(content.button.href)}" style="display:inline-block;background:#c8102e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold">${esc(content.button.label)}</a></p>` : ''}
${content.after.map(p).join('\n')}
<p style="margin:16px 0 0;font-size:13px;color:#5b6475">${esc(content.footer)}</p>
</div></body></html>`;
  return { subject: content.subject, text, html };
}
