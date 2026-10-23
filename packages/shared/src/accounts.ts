import { z } from 'zod';
import { objectId } from './ids.js';
import { roleSchema } from './roles.js';

/* Module 001 contracts: field rules (REQ-2), request/response shapes, user-facing messages. */

/** Exact UI wording of spec 001; the API sends these as `error.message` so the SPA can show them as-is. */
export const ACCOUNT_MESSAGES = {
  nameRequired: 'Vui lòng nhập họ tên.',
  nameLength: 'Họ tên phải có 2–100 ký tự.',
  emailRequired: 'Vui lòng nhập email.',
  emailInvalid: 'Email không đúng định dạng.',
  emailTaken: 'Email này đã được sử dụng.',
  passwordRequired: 'Vui lòng nhập mật khẩu.',
  currentPasswordRequired: 'Vui lòng nhập mật khẩu hiện tại.',
  newPasswordRequired: 'Vui lòng nhập mật khẩu mới.',
  passwordRules: 'Mật khẩu phải có 8–64 ký tự, gồm ít nhất một chữ cái và một chữ số.',
  passwordMismatch: 'Mật khẩu xác nhận không khớp.',
  phoneInvalid: 'Số điện thoại gồm 9–15 chữ số, có thể bắt đầu bằng dấu +.',
  noteTooLong: 'Ghi chú tối đa 500 ký tự.',
  invalidCredentials: 'Email hoặc mật khẩu không đúng.',
  accountLocked: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ giáo viên của bạn.',
  loginLocked: 'Bạn đã nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút.',
  tooManyRequests: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.',
  sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  tooManyPasswordAttempts: 'Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng đăng nhập lại.',
  loggedOut: 'Đã đăng xuất.',
  resetRequested:
    'Nếu email này thuộc một tài khoản giáo viên, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Nếu bạn là học viên, vui lòng liên hệ giáo viên của bạn để được cấp lại mật khẩu.',
  resetDone: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
  resetLinkInvalid: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  wrongCurrentPassword: 'Mật khẩu hiện tại không đúng.',
  samePassword: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  passwordChanged: 'Đã đổi mật khẩu thành công.',
  hasSubmissions:
    'Học viên đã có bài nộp nên không thể xóa để giữ kết quả học tập. Bạn có thể khóa tài khoản thay thế.',
  studentMailLimit: 'Đã gửi 3 email cho học viên này trong 60 phút qua. Vui lòng thử lại sau.',
  bulkLimit: 'Mỗi lần chỉ kích hoạt được tối đa 500 học viên. Vui lòng chọn ít hơn.',
  bulkResendLimit: 'Mỗi lần chỉ gửi lại được tối đa 500 học viên. Vui lòng chọn ít hơn.',
  noPendingSelected: 'Không có học viên Chưa kích hoạt nào trong các học viên đã chọn.',
  noFailedSelected: 'Không có học viên Gửi email thất bại nào trong các học viên đã chọn.',
  invalidImportFile: 'Chỉ chấp nhận tệp Excel (.xlsx) tối đa 2 MB.',
  importMissingColumns: 'Tệp không đúng mẫu: thiếu cột Họ tên hoặc Email.',
  importNoRows: 'Tệp không có dòng dữ liệu nào.',
  importTooManyRows: 'Tệp có hơn 500 dòng dữ liệu. Vui lòng chia thành nhiều tệp.',
  importNothingValid: 'Không có dòng hợp lệ để nhập. Vui lòng sửa tệp theo báo cáo và tải lên lại.',
  activationHint: 'Học viên chỉ đăng nhập được sau khi bạn bấm Kích hoạt ở danh sách học viên.',
  notFound: 'Không tìm thấy nội dung bạn yêu cầu.',
  statusChanged: 'Trạng thái học viên đã thay đổi. Danh sách đã được làm mới.',
} as const;

/** `workspaceMailLimit(n)` — AC-18.6. */
export const workspaceMailLimitMessage = (remaining: number): string =>
  `Đã đạt giới hạn 1.000 email tài khoản trong 24 giờ. Bạn còn gửi được ${remaining.toLocaleString('vi-VN')} email. Vui lòng chọn ít học viên hơn hoặc thử lại sau.`;

/** Module-specific error codes (plan 001). */
export const ACCOUNT_ERROR_CODES = {
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  LOGIN_LOCKED: 'LOGIN_LOCKED',
  INVALID_RESET_LINK: 'INVALID_RESET_LINK',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  SAME_PASSWORD: 'SAME_PASSWORD',
  HAS_SUBMISSIONS: 'HAS_SUBMISSIONS',
  MAIL_LIMIT_STUDENT: 'MAIL_LIMIT_STUDENT',
  MAIL_LIMIT_WORKSPACE: 'MAIL_LIMIT_WORKSPACE',
  BULK_LIMIT: 'BULK_LIMIT',
  NOTHING_ELIGIBLE: 'NOTHING_ELIGIBLE',
  STATUS_CHANGED: 'STATUS_CHANGED',
  INVALID_IMPORT_FILE: 'INVALID_IMPORT_FILE',
  IMPORT_CHANGED: 'IMPORT_CHANGED',
} as const;

/* ---------- field rules (REQ-2, AC-1.3, AC-8.5) ---------- */

const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PHONE_RE = /^\+?\d{9,15}$/;

/** AC-2.2: e-mails compare trimmed and case-insensitively. */
export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => {
  const v = value.trim();
  return v.length <= 254 && EMAIL_RE.test(v);
};

/** The two live rules of AC-2.3 shown under every new-password field. */
export function passwordRules(password: string): { label: string; ok: boolean }[] {
  return [
    { label: '8–64 ký tự', ok: password.length >= 8 && password.length <= 64 },
    {
      label: 'Có ít nhất một chữ cái và một chữ số',
      ok: /\p{L}/u.test(password) && /\d/.test(password),
    },
  ];
}
export const isValidPassword = (password: string): boolean =>
  passwordRules(password).every((r) => r.ok);

const requiredText = (message: string) =>
  z.string({ error: message }).trim().min(1, { error: message });

export const displayNameSchema = requiredText(ACCOUNT_MESSAGES.nameRequired)
  .max(100, {
    error: ACCOUNT_MESSAGES.nameLength,
  })
  .min(2, { error: ACCOUNT_MESSAGES.nameLength });

export const emailSchema = requiredText(ACCOUNT_MESSAGES.emailRequired)
  .refine(isValidEmail, { error: ACCOUNT_MESSAGES.emailInvalid })
  .toLowerCase();

/** A password the user sets (A02, A03, T17, S10). */
export const newPasswordSchema = z
  .string({ error: ACCOUNT_MESSAGES.passwordRequired })
  .min(1, { error: ACCOUNT_MESSAGES.passwordRequired })
  .refine(isValidPassword, { error: ACCOUNT_MESSAGES.passwordRules });

/** Optional text: blank becomes `undefined`. */
const optionalText = <T extends z.ZodType<string | undefined>>(inner: T) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), inner.optional());

export const phoneSchema = optionalText(
  z
    .string()
    .trim()
    .overwrite((v) => v.replace(/[\s.-]/g, ''))
    .refine((v) => PHONE_RE.test(v), { error: ACCOUNT_MESSAGES.phoneInvalid }),
);
export const noteSchema = optionalText(
  z.string().trim().max(500, { error: ACCOUNT_MESSAGES.noteTooLong }),
);

/**
 * Runs even when other fields are invalid, so every wrong field shows its message at once (AC-2.4). Field rules
 * therefore never abort: a field may carry several issues and the first one is the one to show.
 */
const withConfirmation = <T extends z.ZodRawShape, K extends string>(
  shape: T,
  field: keyof T & string,
  confirmField: K,
) =>
  z
    .object({
      ...shape,
      ...({ [confirmField]: z.string().optional() } as Record<K, z.ZodOptional<z.ZodString>>),
    })
    .refine(
      (v) => {
        const raw = v as Record<string, unknown>;
        return !!raw[confirmField] && raw[confirmField] === raw[field];
      },
      { path: [confirmField], error: ACCOUNT_MESSAGES.passwordMismatch, when: () => true },
    );

/* ---------- requests ---------- */

export const registerBodySchema = withConfirmation(
  { displayName: displayNameSchema, email: emailSchema, password: newPasswordSchema },
  'password',
  'passwordConfirm',
);
export type RegisterBody = z.input<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: ACCOUNT_MESSAGES.passwordRequired })
    .min(1, { error: ACCOUNT_MESSAGES.passwordRequired })
    .max(256),
});
export type LoginBody = z.input<typeof loginBodySchema>;

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const resetTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{20,128}$/);

export const passwordResetConfirmSchema = withConfirmation(
  { token: resetTokenSchema, password: newPasswordSchema },
  'password',
  'passwordConfirm',
);
export type PasswordResetConfirmBody = z.input<typeof passwordResetConfirmSchema>;

const currentPasswordSchema = z
  .string({ error: ACCOUNT_MESSAGES.currentPasswordRequired })
  .min(1, { error: ACCOUNT_MESSAGES.currentPasswordRequired })
  .max(256);

export const changePasswordBodySchema = withConfirmation(
  { currentPassword: currentPasswordSchema, newPassword: newPasswordSchema },
  'newPassword',
  'newPasswordConfirm',
);
export type ChangePasswordBody = z.input<typeof changePasswordBodySchema>;

export const changeEmailBodySchema = z.object({
  email: emailSchema,
  currentPassword: currentPasswordSchema,
});
export type ChangeEmailBody = z.input<typeof changeEmailBodySchema>;

export const profileBodySchema = z.object({ displayName: displayNameSchema });

export const studentBodySchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  note: noteSchema,
});
export type StudentBody = z.input<typeof studentBodySchema>;

/* ---------- students ---------- */

/** Chưa kích hoạt · Đang gửi email · Đã kích hoạt · Gửi email thất bại · Đã khóa (AC-11.1). */
export const STUDENT_STATUSES = ['pending', 'sending', 'active', 'failed', 'locked'] as const;
export const studentStatusSchema = z.enum(STUDENT_STATUSES);
export type StudentStatus = z.infer<typeof studentStatusSchema>;

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  pending: 'Chưa kích hoạt',
  sending: 'Đang gửi email',
  active: 'Đã kích hoạt',
  failed: 'Gửi email thất bại',
  locked: 'Đã khóa',
};

/** Filters of T11; `active` includes `sending` (AC-11.4). */
export const STUDENT_FILTERS = ['all', 'pending', 'active', 'failed', 'locked'] as const;
export const studentFilterSchema = z.enum(STUDENT_FILTERS);
export type StudentFilter = z.infer<typeof studentFilterSchema>;

export const MAIL_FAIL_REASONS = ['not_accepted', 'bounced'] as const;
export type MailFailReason = (typeof MAIL_FAIL_REASONS)[number];
export const MAIL_FAIL_MESSAGES: Record<MailFailReason, string> = {
  not_accepted: 'Chưa gửi được thư. Vui lòng gửi lại.',
  bounced: 'Địa chỉ email không nhận được thư. Hãy kiểm tra lại email.',
};

export const studentSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  note: z.string().nullable(),
  status: studentStatusSchema,
  failReason: z.enum(MAIL_FAIL_REASONS).nullable(),
  /** Kind of the last password e-mail (what "Gửi lại" re-sends). */
  mailKind: z.enum(['activation', 'new_password']).nullable(),
  classCount: z.number().int(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Student = z.infer<typeof studentSchema>;

export const STUDENT_PAGE_SIZE = 50;

export const studentListQuerySchema = z.object({
  q: z.string().trim().max(254).optional(),
  status: studentFilterSchema.default('all'),
  page: z.coerce.number().int().min(1).default(1),
});
export type StudentListQuery = z.input<typeof studentListQuerySchema>;

export const studentListResponseSchema = z.object({
  items: z.array(studentSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  /** Count per filter for the whole workspace (search not applied); `active` includes `sending`. */
  counts: z.record(studentFilterSchema, z.number()),
  /** Size of the workspace (empty-state choice of AC-11.5). */
  workspaceTotal: z.number(),
});
export type StudentListResponse = z.infer<typeof studentListResponseSchema>;

export const BULK_MAX = 500;

/** A bulk selection: explicit ids, or every student matching the filter (AC-7.2). */
export const bulkSelectionSchema = z.union([
  z.object({ ids: z.array(objectId).min(1).max(2_000) }),
  z.object({
    filter: z.object({ q: z.string().trim().max(254).optional(), status: studentFilterSchema }),
  }),
]);
export type BulkSelection = z.infer<typeof bulkSelectionSchema>;

export const BULK_ACTIONS = ['activate', 'resend'] as const;
export const bulkActionSchema = z.enum(BULK_ACTIONS);
export type BulkAction = z.infer<typeof bulkActionSchema>;

export const bulkPreviewBodySchema = z.object({
  action: bulkActionSchema,
  selection: bulkSelectionSchema,
});
export const bulkPreviewResponseSchema = z.object({ eligible: z.number(), skipped: z.number() });
export type BulkPreview = z.infer<typeof bulkPreviewResponseSchema>;

/** Result of an action that sends password e-mails; follow `batchId` until every mail has a result. */
export const mailActionResponseSchema = z.object({
  batchId: z.string().nullable(),
  queued: z.number(),
  skipped: z.number(),
});
export type MailActionResponse = z.infer<typeof mailActionResponseSchema>;

export const emailBatchSchema = z.object({
  id: z.string(),
  total: z.number(),
  sending: z.number(),
  sent: z.number(),
  failed: z.number(),
});
export type EmailBatch = z.infer<typeof emailBatchSchema>;

/* ---------- import (REQ-9, REQ-10) ---------- */

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 500;
export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const importReportSchema = z.object({
  importId: z.string(),
  total: z.number(),
  validCount: z.number(),
  errorCount: z.number(),
  errors: z.array(
    z.object({ line: z.number(), displayName: z.string(), email: z.string(), reason: z.string() }),
  ),
  /** Every checked row in file order; `reason` is null for a valid row (T12 report table). */
  rows: z.array(
    z.object({
      line: z.number(),
      displayName: z.string(),
      email: z.string(),
      phone: z.string(),
      reason: z.string().nullable(),
    }),
  ),
});
export type ImportReport = z.infer<typeof importReportSchema>;

export const importResultSchema = z.object({
  added: z.array(z.object({ id: z.string(), displayName: z.string(), email: z.string() })),
});
export type ImportResult = z.infer<typeof importResultSchema>;

/* ---------- e-mails (REQ-17) ---------- */

export const MAIL_TAGS = {
  activation: 'activation',
  newPassword: 'new_password',
  gvPasswordReset: 'gv_password_reset',
  deadlineReminder: 'deadline_reminder',
} as const;

/** Structured content of an e-mail; the API renders html/text from it and the preview drawer shows it. */
export const mailContentSchema = z.object({
  subject: z.string(),
  paragraphs: z.array(z.string()),
  credentials: z.array(z.object({ label: z.string(), value: z.string() })),
  items: z.array(z.object({ title: z.string(), detail: z.string() })),
  button: z.object({ label: z.string(), href: z.string() }).nullable(),
  after: z.array(z.string()),
  footer: z.string(),
});
export type MailContent = z.infer<typeof mailContentSchema>;

export const mailPreviewSchema = z.object({
  kind: z.enum(['activation', 'new_password', 'deadline_reminder']),
  from: z.string(),
  to: z.string(),
  content: mailContentSchema,
});
export const mailPreviewsResponseSchema = z.object({ templates: z.array(mailPreviewSchema) });
export type MailPreview = z.infer<typeof mailPreviewSchema>;

/* ---------- own account (REQ-14, REQ-15) ---------- */

export const accountResponseSchema = z.object({
  id: z.string(),
  role: roleSchema,
  displayName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  createdAt: z.string(),
  /** HV only: whether the current password was generated by the system (AC-15.5). */
  passwordSource: z.enum(['system', 'user']).nullable(),
});
export type AccountResponse = z.infer<typeof accountResponseSchema>;

export const resetLinkResponseSchema = z.object({ email: z.string() });

/** First message per field from Zod issues (client parse or `details` of a 400): the one a form shows. */
export function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}
