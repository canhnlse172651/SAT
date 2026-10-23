import { formatVnDate, type MailPreview } from '@sat/shared';
import {
  MAIL_FROM_NAME,
  MASKED_PASSWORD,
  activationMail,
  deadlineReminderSample,
  newPasswordMail,
} from './account-mail.templates.js';

/**
 * AC-17.6: the read-only samples of "Xem mẫu email" — built by the same template functions as the
 * real e-mails, with the password always masked.
 */
export function mailPreviews(input: {
  teacherName: string;
  sample: { displayName: string; email: string };
  appOrigin: string;
  today: Date;
}): MailPreview[] {
  const student = {
    studentName: input.sample.displayName,
    teacherName: input.teacherName,
    email: input.sample.email,
    password: MASKED_PASSWORD,
    loginUrl: `${input.appOrigin}/dang-nhap`,
  };
  const date = formatVnDate(input.today);
  return [
    {
      kind: 'activation',
      from: MAIL_FROM_NAME,
      to: input.sample.email,
      content: activationMail(student),
    },
    {
      kind: 'new_password',
      from: MAIL_FROM_NAME,
      to: input.sample.email,
      content: newPasswordMail(student),
    },
    {
      kind: 'deadline_reminder',
      from: MAIL_FROM_NAME,
      to: input.sample.email,
      content: deadlineReminderSample({
        studentName: input.sample.displayName,
        className: 'Lớp HSK1 – Tối 2-4-6',
        date,
        sets: [
          { title: 'Bộ 1 · Chào hỏi', lesson: 'Bài 1 · 你好' },
          { title: 'Bộ 2 · Số đếm', lesson: 'Bài 2 · 数字' },
        ],
        url: `${input.appOrigin}/hv`,
      }),
    },
  ];
}
