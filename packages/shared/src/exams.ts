import { z } from 'zod';
import { vnDay } from './classes.js';
import { classStatusSchema } from './curriculum.js';
import {
  type ExerciseSetContent,
  EXERCISE_LIMITS,
  answersSchema,
  learnQuestionSchema,
  reviewRowSchema,
  setProblems,
} from './exercises.js';
import { objectId } from './ids.js';
import { formatVnDate, formatVnDateTime, formatVnTime, toVnParts } from './time.js';

/* Module 006 contracts: exam states from the clock, schedule rules, exact UI wording, HTTP schemas of T10 / T22 / T16 / T14 / S07 / S08. */

export const EXAM_LIMITS = {
  nameMax: 150,
  instructionsMax: EXERCISE_LIMITS.instructionsMax,
  questionsMax: 100,
  durationMin: 1,
  durationMax: 300,
  classesMax: 50,
  /** AC-12.2: answers reaching the system up to 10 s after an attempt's end still count. */
  graceMs: 10_000,
} as const;

const L = EXAM_LIMITS;

/** Exact UI wording of spec 006 (the API sends these as `error.message`). */
export const EXAM_MESSAGES = {
  // T22 fields and conditions (AC-2.3, AC-3.3, AC-3.5)
  nameInvalid: 'Tên bài thi bắt buộc, tối đa 150 ký tự',
  needQuestion: 'Bài thi cần ít nhất 1 câu hỏi',
  questionLimit: 'Bài thi có tối đa 100 câu hỏi',
  needClass: 'Chưa chọn lớp được giao',
  needOpen: 'Chưa nhập giờ mở',
  openPast: 'Giờ mở không được sớm hơn thời điểm hiện tại',
  needDuration: 'Chưa nhập thời lượng làm bài',
  durationInvalid: 'Thời lượng phải là số nguyên từ 1 đến 300 phút',
  needClose: 'Chưa nhập giờ đóng',
  closeTooEarly: (n: number) =>
    `Giờ đóng phải sau giờ mở ít nhất bằng thời lượng làm bài (${n} phút).`,
  closePast: 'Giờ đóng phải ở tương lai.',
  dateTimeInvalid: 'Ngày giờ không hợp lệ — nhập dạng dd/mm/yyyy hh:mm',
  // T22 states and refusals (AC-2.7, AC-2.8, REQ-4, REQ-5, REQ-6)
  changedElsewhere: 'Bài thi đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất.',
  leaveConfirm: 'Bạn có thay đổi chưa lưu. Rời trang và bỏ thay đổi?',
  lockedBanner:
    'Đề thi đã khóa vì đã có học viên bắt đầu làm bài. Chỉ sửa được tên, hướng dẫn, lớp được giao và lùi giờ đóng.',
  justLocked:
    'Đề thi vừa bị khóa vì học viên đã bắt đầu làm bài. Thay đổi câu hỏi và lịch không được lưu.',
  closedBanner: 'Bài thi đã đóng — không thể đổi đề, lớp được giao hoặc lịch.',
  closeOnlyLater: 'Khi đã có học viên làm bài, chỉ có thể lùi giờ đóng muộn hơn.',
  cannotRemoveClass: (name: string) =>
    `Không thể bỏ lớp ${name} vì đã có học viên của lớp làm bài thi này.`,
  classStartsLater: (name: string, day: Date) =>
    `Lớp ${name} bắt đầu ngày ${formatVnDate(day)} — học viên lớp này chỉ vào thi được từ ngày đó.`,
  classStartsAfterClose: (name: string) =>
    `Lớp ${name} bắt đầu sau giờ đóng — học viên lớp này sẽ không làm được bài thi.`,
  unscheduleConfirm: (name: string) =>
    `Hủy lịch bài thi «${name}»? Học viên sẽ không còn thấy bài thi này.`,
  deleteConfirm: (name: string) => `Xóa bài thi «${name}»? Thao tác không hoàn tác được.`,
  deleted: 'Đã xóa bài thi',
  hasAttempts:
    'Bài thi đã có học viên làm bài nên không xóa được — hãy Lưu trữ sau khi bài thi đóng.',
  archiveOnlyClosed: 'Chỉ lưu trữ được bài thi Đã đóng.',
  savedAt: (hm: string) => `Đã lưu lúc ${hm}`,
  scheduledAt: (at: Date) => `Đã lên lịch · mở lúc ${formatVnDateTime(at)}`,
  // T10 (REQ-1)
  noExams: 'Chưa có bài thi nào',
  noMatch: 'Không có bài thi phù hợp',
  archivedSwitch: (n: number) => `Hiện bài thi lưu trữ (${n})`,
  // T16 (REQ-15)
  noStudents: 'Lớp chưa có học viên',
  lateJoin: 'Vào lớp sau khi bài thi đóng',
  // S07 / S08 (REQ-7 … REQ-14)
  noLearnerExams: 'Chưa có bài thi nào.',
  oneAttempt: 'Bạn chỉ được làm bài thi này một lần.',
  clockRuns: 'Đồng hồ chạy liên tục kể cả khi bạn thoát ra hoặc mất kết nối.',
  shortTime: (close: Date, minutes: number) =>
    `Bài thi đóng lúc ${formatVnTime(close)} — bạn chỉ còn ${minutes} phút để làm bài.`,
  saving: 'Đang lưu…',
  savedAtHms: (hms: string) => `Đã lưu lúc ${hms}`,
  warn5: 'Còn 5 phút',
  warn1: 'Còn 1 phút',
  offline:
    'Mất kết nối — đồng hồ vẫn chạy. Câu trả lời chưa lưu sẽ không được tính nếu không kết nối lại trước khi hết giờ.',
  unsaved: (n: number) => `${n} câu chưa lưu`,
  heldElsewhere: 'Bài thi đang được làm ở thiết bị hoặc cửa sổ khác',
  leaveWarning: 'Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng.',
  allDone: 'Bạn đã hoàn thành tất cả câu hỏi',
  noRedo: 'Sau khi nộp bạn không thể làm lại.',
  submitOffline: 'Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.',
  autoSubmitted: (at: Date) => `Hết giờ — bài thi đã được nộp tự động lúc ${formatVnTime(at)}`,
  removed:
    'Bạn không còn thuộc lớp được giao bài thi này. Câu trả lời đã lưu sẽ được nộp tự động khi hết giờ.',
  revealLater: (close: Date) =>
    `Đáp án và giải thích sẽ hiển thị sau khi bài thi đóng lúc ${formatVnDateTime(close)}.`,
  oneAttemptDone: 'Bạn chỉ làm bài thi này một lần.',
  noShow: 'Bạn đã không làm bài thi này.',
  closedNoResult: 'Bài thi đã đóng.',
  autoLabel: 'Nộp tự động',
} as const;
const M = EXAM_MESSAGES;

export const EXAM_ERROR_CODES = {
  /** 422: a field of the exam is invalid (`details.field`: name | dur | open | close | instructions). */
  INVALID_EXAM: 'INVALID_EXAM',
  /** 422: "Lên lịch" / "Lưu thay đổi" while conditions are missing (`details.issues`). */
  EXAM_NOT_READY: 'EXAM_NOT_READY',
  /** 409: questions, open time or duration changed after the first attempt (AC-4.2, AC-4.3). */
  EXAM_LOCKED: 'EXAM_LOCKED',
  /** 409: the exam is closed — only name and instructions (AC-4.4). */
  EXAM_CLOSED: 'EXAM_CLOSED',
  /** 409: delete / unschedule / remove a class with attempts (AC-6.2, AC-5.4, AC-3.8). */
  EXAM_HAS_ATTEMPTS: 'EXAM_HAS_ATTEMPTS',
  /** 409: earlier close time with attempts (AC-5.1). */
  EXAM_CLOSE_EARLIER: 'EXAM_CLOSE_EARLIER',
  /** 409: the action does not fit the exam's state (archive a non-closed exam, …). */
  EXAM_STATE: 'EXAM_STATE',
  /** 409: the HV may not start now (AC-8.4); `details.view` is the current S07 row. */
  EXAM_NOT_STARTABLE: 'EXAM_NOT_STARTABLE',
  /** 409: another device or tab holds the attempt (AC-10.4). */
  EXAM_HELD_ELSEWHERE: 'EXAM_HELD_ELSEWHERE',
  /** 409: the attempt is submitted (manually or automatically). */
  EXAM_SUBMITTED: 'EXAM_SUBMITTED',
  /** 409: the attempt's time is over (answers after end + 10 s, AC-12.2). */
  EXAM_TIME_OVER: 'EXAM_TIME_OVER',
  /** 409: the HV left every assigned class during the attempt (AC-12.5). */
  EXAM_NOT_MEMBER: 'EXAM_NOT_MEMBER',
} as const;

/* ---------- state (AC-3.6) ---------- */

export const EXAM_PHASES = ['draft', 'scheduled', 'archived'] as const;
export type ExamPhase = (typeof EXAM_PHASES)[number];
export const EXAM_STATES = ['draft', 'scheduled', 'open', 'closed', 'archived'] as const;
export type ExamState = (typeof EXAM_STATES)[number];
export const examStateSchema = z.enum(EXAM_STATES);

export const EXAM_STATE_LABELS: Record<ExamState, string> = {
  draft: 'Nháp',
  scheduled: 'Đã lên lịch',
  open: 'Đang mở',
  closed: 'Đã đóng',
  archived: 'Lưu trữ',
};

export function examStateAt(
  exam: { phase: ExamPhase; opensAt: Date | null; closesAt: Date | null },
  now: Date,
): ExamState {
  if (exam.phase !== 'scheduled') return exam.phase;
  if (exam.closesAt && now >= exam.closesAt) return 'closed';
  if (exam.opensAt && now >= exam.opensAt) return 'open';
  return 'scheduled';
}

/** AC-8.3, AC-5.2: an attempt ends at the earlier of start + duration and the close time. */
export const attemptEndsAt = (startedAt: Date, durationMin: number, closesAt: Date): Date =>
  new Date(Math.min(startedAt.getTime() + durationMin * 60_000, closesAt.getTime()));

/* ---------- time input and clocks (AC-3.2, AC-7.5, AC-9.1) ---------- */

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** 'dd/MM/yyyy HH:mm' in Vietnam time → instant; null when not a real date-time. */
export function parseVnDateTime(input: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const [day, month, year, hour, minute] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  if (hour > 23 || minute > 59) return null;
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day)
    return null;
  return new Date(utc.getTime() - 7 * 3_600_000);
}

/** The editor's text of an instant: 'dd/MM/yyyy HH:mm' in Vietnam time. */
export const formatVnDateTimeInput = (d: Date): string => `${formatVnDate(d)} ${formatVnTime(d)}`;

/** 'dd/MM/yyyy HH:mm' (AC-3.2) — T10, T16, T14 cells. */
export const formatVnStamp = formatVnDateTimeInput;

/** AC-9.1: mm:ss under an hour, h:mm:ss from an hour; never negative. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = pad(Math.floor((s % 3600) / 60));
  const ss = pad(s % 60);
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** AC-7.5: "Mở sau hh:mm:ss". */
export function formatHms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** "Thời gian làm bài": "32 phút 15 giây". */
export function formatSpent(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (!m) return `${r} giây`;
  return r ? `${m} phút ${r} giây` : `${m} phút`;
}

/** "HH:mm:ss" of the autosave line (AC-9.3). */
export const formatVnHms = (d: Date): string => {
  const p = toVnParts(d);
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
};

/* ---------- conditions to schedule / save (AC-3.3 … AC-3.5, AC-4.1) ---------- */

export interface ExamDraft {
  name: string;
  content: ExerciseSetContent;
  classIds: readonly string[];
  opensAt: Date | null;
  durationMin: number | null;
  closesAt: Date | null;
}

/** One unmet condition; `target` = field key (name, questions, classes, open, dur, close) or "q<n>" for a question. */
export interface ExamIssue {
  target: string;
  message: string;
}

export const nameProblem = (name: string): string | null =>
  !name.trim() || [...name.trim()].length > L.nameMax ? M.nameInvalid : null;

export const durationProblem = (d: number | null): string | null =>
  d !== null && (!Number.isInteger(d) || d < L.durationMin || d > L.durationMax)
    ? M.durationInvalid
    : null;

/** AC-3.3: the close-time rule (null when fine or not enough data). */
export function closeProblem(
  opensAt: Date | null,
  durationMin: number | null,
  closesAt: Date | null,
  now: Date,
): string | null {
  if (!closesAt) return null;
  if (opensAt && durationMin && closesAt.getTime() < opensAt.getTime() + durationMin * 60_000)
    return M.closeTooEarly(durationMin);
  if (closesAt <= now) return M.closePast;
  return null;
}

const minuteOf = (d: Date) => Math.floor(d.getTime() / 60_000);

/**
 * AC-3.4 / AC-3.5: every unmet condition in screen order. `checkOpen`: the open time may not be before the current
 * minute (on "Lên lịch", and on "Lưu thay đổi" only when the open time changed — AC-4.1).
 */
export function examIssues(exam: ExamDraft, now: Date, opts: { checkOpen: boolean }): ExamIssue[] {
  const out: ExamIssue[] = [];
  const name = nameProblem(exam.name);
  if (name) out.push({ target: 'name', message: name });
  const qs = exam.content.questions;
  if (!qs.length) out.push({ target: 'questions', message: M.needQuestion });
  if (qs.length > L.questionsMax) out.push({ target: 'questions', message: M.questionLimit });
  const seen = new Set<string>();
  for (const p of setProblems('-', exam.content)) {
    if (p.question === null) continue;
    const message = `Câu ${p.question}: ${p.message}${p.context ? ` (${p.context})` : ''}`;
    if (seen.has(message)) continue;
    seen.add(message);
    out.push({ target: `q${p.question.split('.')[0] ?? p.question}`, message });
  }
  if (!exam.classIds.length) out.push({ target: 'classes', message: M.needClass });
  if (!exam.opensAt) out.push({ target: 'open', message: M.needOpen });
  else if (opts.checkOpen && minuteOf(exam.opensAt) < minuteOf(now))
    out.push({ target: 'open', message: M.openPast });
  if (exam.durationMin === null) out.push({ target: 'dur', message: M.needDuration });
  else if (durationProblem(exam.durationMin))
    out.push({ target: 'dur', message: M.durationInvalid });
  if (!exam.closesAt) out.push({ target: 'close', message: M.needClose });
  else {
    const close = closeProblem(
      exam.opensAt,
      durationProblem(exam.durationMin) ? null : exam.durationMin,
      exam.closesAt,
      now,
    );
    if (close) out.push({ target: 'close', message: close });
  }
  return out;
}

/** AC-3.7: warnings for upcoming classes that start after the open day. */
export function classStartWarnings(
  classes: readonly { name: string; status: 'upcoming' | 'active' | 'ended'; startDate: string }[],
  opensAt: Date | null,
  closesAt: Date | null,
): string[] {
  if (!opensAt) return [];
  const openDay = vnDay(opensAt);
  return classes.flatMap((c) => {
    if (c.status !== 'upcoming' || c.startDate <= openDay) return [];
    if (closesAt && c.startDate > vnDay(closesAt)) return [M.classStartsAfterClose(c.name)];
    const [y, mo, d] = c.startDate.split('-').map(Number) as [number, number, number];
    return [M.classStartsLater(c.name, new Date(Date.UTC(y, mo - 1, d) - 7 * 3_600_000))];
  });
}

/* ---------- S07 row (AC-7.3) ---------- */

export const LEARNER_ROW_KINDS = [
  'submitted',
  'doing',
  'noShow',
  'closed',
  'notOpen',
  'ended',
  'open',
] as const;
export type LearnerRowKind = (typeof LEARNER_ROW_KINDS)[number];

export const learnerRowSchema = z.object({
  kind: z.enum(LEARNER_ROW_KINDS),
  percent: z.number().nullable().default(null),
  endsAt: z.string().nullable().default(null),
});
export type LearnerRow = z.infer<typeof learnerRowSchema>;

/** The one state line of an S07 row (AC-7.3), from the row and the exam's times. */
export function learnerRowLine(
  row: { kind: LearnerRowKind; percent?: number | null; endsAt?: Date | string | null },
  exam: { opensAt: Date | string; closesAt: Date | string },
  now: Date,
): string {
  const d = (v: Date | string) => (typeof v === 'string' ? new Date(v) : v);
  switch (row.kind) {
    case 'submitted':
      return `Đã nộp · ${row.percent ?? 0}/100`;
    case 'doing':
      return `Đang làm · còn ${formatCountdown(row.endsAt ? d(row.endsAt).getTime() - now.getTime() : 0)}`;
    case 'noShow':
      return 'Đã đóng · Không làm bài';
    case 'closed':
      return 'Đã đóng';
    case 'notOpen':
      return `Mở lúc ${formatVnDateTime(d(exam.opensAt))}`;
    case 'ended':
      return 'Lớp đã kết thúc — không thể vào thi.';
    default:
      return `Đang mở · đóng lúc ${formatVnDateTime(d(exam.closesAt))}`;
  }
}

/* ---------- HTTP contracts ---------- */

const iso = z.string();
const isoN = z.string().nullable();

/** POST /api/exams, PUT /api/exams/:id, POST /api/exams/:id/schedule. Content is checked with 005's rules on the server. */
export const examInputSchema = z.object({
  name: z.string().max(1000),
  content: z.unknown(),
  classIds: z.array(objectId).max(L.classesMax).default([]),
  opensAt: z.iso.datetime({ offset: true }).nullable().default(null),
  durationMin: z.number().nullable().default(null),
  closesAt: z.iso.datetime({ offset: true }).nullable().default(null),
});
export type ExamInput = z.input<typeof examInputSchema>;

export const examSaveSchema = examInputSchema.extend({ expectedVersion: z.number().int() });
export type ExamSave = z.input<typeof examSaveSchema>;
export const expectedVersionSchema = z.object({ expectedVersion: z.number().int() });

const classRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: classStatusSchema,
  startDate: z.string(),
});

/** T22: the whole exam. */
export const examSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.unknown(),
  classIds: z.array(z.string()),
  /** Assigned classes still existing, with what AC-3.7 needs. */
  classes: z.array(classRefSchema),
  opensAt: isoN,
  durationMin: z.number().nullable(),
  closesAt: isoN,
  state: examStateSchema,
  locked: z.boolean(),
  attemptCount: z.number(),
  version: z.number(),
  updatedAt: iso,
  serverNow: iso,
});
export type Exam = z.infer<typeof examSchema>;

/** T10 row (AC-1.1). */
export const examListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  questionCount: z.number(),
  totalPoints: z.number(),
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  opensAt: isoN,
  durationMin: z.number().nullable(),
  closesAt: isoN,
  state: examStateSchema,
  locked: z.boolean(),
  submitted: z.number(),
  takers: z.number(),
  updatedAt: iso,
});
export type ExamListItem = z.infer<typeof examListItemSchema>;
export const examListSchema = z.object({ items: z.array(examListItemSchema), serverNow: iso });

/** AC-3.1: classes a GV may assign (upcoming and active). */
export const examClassOptionsSchema = z.object({
  items: z.array(classRefSchema.extend({ memberCount: z.number() })),
});
export type ExamClassOption = z.infer<typeof examClassOptionsSchema>['items'][number];

/** S07 row (AC-7.2, AC-7.3). */
export const learnerExamSchema = z.object({
  id: z.string(),
  name: z.string(),
  classNames: z.array(z.string()),
  questionCount: z.number(),
  durationMin: z.number(),
  opensAt: iso,
  closesAt: iso,
  row: learnerRowSchema,
});
export type LearnerExam = z.infer<typeof learnerExamSchema>;
export const learnerExamListSchema = z.object({
  items: z.array(learnerExamSchema),
  serverNow: iso,
});

/** S08 result (AC-14.1 … AC-14.5). */
export const examResultSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('submitted'),
    startedAt: iso,
    submittedAt: iso,
    auto: z.boolean(),
    score: z.number(),
    maxScore: z.number(),
    percent: z.number(),
    /** Answers and explanations: only once the exam is closed and every attempt submitted (AC-14.3). */
    revealed: z.boolean(),
    rows: z.array(reviewRowSchema),
  }),
  z.object({ kind: z.literal('noShow') }),
  z.object({ kind: z.literal('closed') }),
]);
export type ExamResult = z.infer<typeof examResultSchema>;

/** GET /api/learn/exams/:id — the lobby facts and, after the attempt, the result; never a question (AC-8.1, AC-16.3). */
export const learnerExamViewSchema = z.object({
  exam: learnerExamSchema.extend({ instructions: z.string() }),
  state: examStateSchema,
  canStart: z.boolean(),
  attempt: z
    .object({ status: z.enum(['doing', 'submitted']), startedAt: iso, endsAt: iso })
    .nullable(),
  result: examResultSchema.nullable(),
  serverNow: iso,
});
export type LearnerExamView = z.infer<typeof learnerExamViewSchema>;

export const holderSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
const partIdKey = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

export const examHolderBodySchema = z.object({ holder: holderSchema });
export const examSaveAnswersSchema = z.object({
  holder: holderSchema,
  answers: z.record(partIdKey, answersSchema.valueType).default({}),
  lastIndex: z.number().int().min(0).max(99).optional(),
});
export type ExamSaveAnswers = z.input<typeof examSaveAnswersSchema>;
export const examSubmitSchema = z.object({
  holder: holderSchema,
  submitKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  answers: z.record(partIdKey, answersSchema.valueType).default({}),
});
export type ExamSubmit = z.input<typeof examSubmitSchema>;

/** POST start / open: the attempt with its questions (no key, no explanation — AC-16.4). */
export const examAttemptSchema = z.object({
  examId: z.string(),
  name: z.string(),
  startedAt: iso,
  endsAt: iso,
  questions: z.array(learnQuestionSchema),
  answers: answersSchema,
  lastIndex: z.number(),
  serverNow: iso,
});
export type ExamAttempt = z.infer<typeof examAttemptSchema>;

/** GET clock (5 s poll): server time, end, who holds the attempt (AC-5.2, AC-10.4, AC-12.3, AC-12.5). */
export const examClockSchema = z.object({
  serverNow: iso,
  status: z.enum(['none', 'doing', 'submitted']),
  endsAt: isoN,
  holder: z.string().nullable(),
  removed: z.boolean(),
  submittedAt: isoN,
  auto: z.boolean(),
});
export type ExamClock = z.infer<typeof examClockSchema>;

export const savedSchema = z.object({ savedAt: iso });

/* T16 (REQ-15) */
export const T16_KINDS = ['submitted', 'doing', 'noShow', 'lateJoin', 'todo'] as const;
export type T16Kind = (typeof T16_KINDS)[number];
export const T16_LABELS: Record<T16Kind, string> = {
  submitted: 'Đã nộp',
  doing: 'Đang làm',
  noShow: 'Không làm bài',
  lateJoin: M.lateJoin,
  todo: 'Chưa làm',
};

export const examClassResultsSchema = z.object({
  exam: z.object({
    id: z.string(),
    name: z.string(),
    opensAt: isoN,
    durationMin: z.number().nullable(),
    closesAt: isoN,
    state: examStateSchema,
    questionCount: z.number(),
    totalPoints: z.number(),
  }),
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  classId: z.string().nullable(),
  rows: z.array(
    z.object({
      student: z.object({ id: z.string(), name: z.string(), locked: z.boolean() }),
      kind: z.enum(T16_KINDS),
      percent: z.number().nullable(),
      startedAt: isoN,
      endsAt: isoN,
      submittedAt: isoN,
      auto: z.boolean(),
    }),
  ),
  serverNow: iso,
});
export type ExamClassResults = z.infer<typeof examClassResultsSchema>;

/** T14 for an exam submission (AC-15.5). */
export const examSubmissionSchema = z.object({
  student: z.object({ id: z.string(), name: z.string() }),
  class: z.object({ id: z.string(), name: z.string() }),
  exam: z.object({ id: z.string(), name: z.string() }),
  startedAt: iso,
  submittedAt: iso,
  auto: z.boolean(),
  score: z.number(),
  maxScore: z.number(),
  percent: z.number(),
  rows: z.array(reviewRowSchema),
});
export type ExamSubmission = z.infer<typeof examSubmissionSchema>;

/** AC-13.5: exam results per HV × assigned class, for 008 / 009. */
export const examResultRowSchema = z.object({
  examId: z.string(),
  classId: z.string(),
  studentId: z.string(),
  kind: z.enum(['submitted', 'noShow']),
  percent: z.number(),
  submittedAt: isoN,
  auto: z.boolean(),
  closesAt: iso,
  archived: z.boolean(),
});
export type ExamResultRow = z.infer<typeof examResultRowSchema>;
export const examResultRowsSchema = z.object({ items: z.array(examResultRowSchema) });
