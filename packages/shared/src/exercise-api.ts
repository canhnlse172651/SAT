import { z } from 'zod';
import { formatScore } from './numbers.js';
import { formatVnDate } from './time.js';
import { learnerSetStatusSchema } from './classes.js';
import { classStatusSchema } from './curriculum.js';
import { answersSchema, learnQuestionSchema, reviewRowSchema } from './exercises.js';

/* Module 005 HTTP contracts of S05 / S06 / T14 (kept apart from exercises.ts: classes.ts → curriculum.ts → exercises.ts). */

export const EXERCISE_LEARN_MESSAGES = {
  alreadySubmitted: 'Bài đã nộp — mỗi bộ bài tập chỉ làm một lần',
  notSubmitted: 'Bạn chưa nộp bài này.',
  nothingAnswered: 'Bạn cần trả lời ít nhất 1 câu trước khi nộp bài',
  notOpen: 'Bài tập chưa mở — giáo viên chưa đặt hạn nộp.',
  noDeadline: 'Giáo viên chưa đặt hạn nộp',
  keptAnswers: 'Câu trả lời đã lưu của bạn được giữ lại.',
  unavailable: 'Bài tập này hiện không khả dụng. Câu trả lời đã lưu của bạn được giữ lại.',
  updatedByTeacher: 'Bộ bài tập vừa được giáo viên cập nhật. Hãy kiểm tra lại câu trả lời.',
  saving: 'Đang lưu…',
  saved: 'Đã lưu',
  offline: 'Mất kết nối – câu trả lời chưa được lưu',
  leaveWarning: 'Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng.',
  allDone: 'Bạn đã hoàn thành tất cả câu hỏi',
  submitOffline: 'Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại.',
  oneAttempt: 'Bài đã nộp — mỗi bộ bài tập chỉ làm một lần',
  lateNote: 'vẫn được tính điểm đầy đủ',
} as const;

/** "3 câu chưa hoàn thành: 2, 4, 5" (AC-15.1). */
export const unfinishedLine = (numbers: readonly number[]): string =>
  `${numbers.length} câu chưa hoàn thành: ${numbers.join(', ')}`;

/** "Điểm đã được cập nhật ngày <dd/MM/yyyy> do giáo viên sửa đáp án: <cũ> → <mới>" (AC-19.5), on S06 and T14. */
export const regradeNote = (at: string, from: number, to: number): string =>
  `Điểm đã được cập nhật ngày ${formatVnDate(new Date(at))} do giáo viên sửa đáp án: ${formatScore(from)} → ${formatScore(to)}`;

const isoDate = z.string();

/** S05 start screen (AC-14.1, AC-23.3, AC-23.8) and, while an attempt is in progress, its questions (AC-14.7). */
export const exerciseViewSchema = z.object({
  classId: z.string(),
  classStatus: classStatusSchema,
  lesson: z.object({ id: z.string(), name: z.string() }),
  set: z.object({
    id: z.string(),
    title: z.string(),
    instructions: z.string(),
    questionCount: z.number(),
    totalPoints: z.number(),
    status: learnerSetStatusSchema,
    score: z.number().nullable(),
    maxScore: z.number().nullable(),
    late: z.boolean(),
    deadlineLabel: z.string().nullable(),
    canWork: z.boolean(),
    blockedReason: z.string().nullable(),
  }),
  /** "Luyện tập cho: <bước học>" when the HV can see the linked step (AC-1.5). */
  practiceFor: z.object({ id: z.string(), title: z.string() }).nullable(),
  hasAttempt: z.boolean(),
  /** Only while the attempt is in progress and the set is open: never a key or an explanation (AC-16.5). */
  attempt: z
    .object({
      questions: z.array(learnQuestionSchema),
      answers: answersSchema,
      lastIndex: z.number(),
      /** AC-18.4: the set changed while the attempt was in progress. */
      updated: z.boolean(),
    })
    .nullable(),
});
export type ExerciseView = z.infer<typeof exerciseViewSchema>;

const partIdKey = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

/** Autosave: only the changed questions (last write wins per question, AC-14.4, edge case "2 tab"). */
export const saveAttemptBodySchema = z.object({
  answers: z.record(partIdKey, answersSchema.valueType).default({}),
  lastIndex: z.number().int().min(0).max(99).optional(),
});
export type SaveAttemptBody = z.input<typeof saveAttemptBodySchema>;

export const submitBodySchema = z.object({
  /** One key per submission from the client: a repeat of the same key is the same submission (AC-15.5). */
  submitKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  answers: z.record(partIdKey, answersSchema.valueType).default({}),
});
export type SubmitBody = z.input<typeof submitBodySchema>;

/** S06 "Xem lại bài làm" (AC-16.2) — or only `submitted: false` before a submission (AC-16.5). */
export const reviewSchema = z.object({
  classId: z.string(),
  lesson: z.object({ id: z.string(), name: z.string() }),
  setId: z.string(),
  title: z.string(),
  submitted: z.boolean(),
  submittedAt: isoDate.nullable(),
  late: z.boolean(),
  /** Effective deadline day (yyyy-MM-dd) the late label refers to. */
  deadline: z.string().nullable(),
  score: z.number().nullable(),
  maxScore: z.number().nullable(),
  percent: z.number().nullable(),
  regrade: z.object({ at: isoDate, from: z.number(), to: z.number() }).nullable(),
  rows: z.array(reviewRowSchema),
});
export type Review = z.infer<typeof reviewSchema>;

/** T14 query: `/gv/bai-nop?lop=<classId>&hv=<studentId>&bo=<setId>`. */
export const submissionQuerySchema = z.object({
  classId: z.string().max(40),
  studentId: z.string().max(40),
  setId: z.string().max(40),
});

export const SUBMISSION_NOTES = {
  hidden: 'Section Bài tập đang ẩn với lớp này',
  archived: 'Bộ bài tập đang lưu trữ',
} as const;

/** T14 "Xem bài nộp" (AC-20.1 … AC-20.6): read-only, the same rows as S06 with the question text. */
export const submissionSchema = z.object({
  student: z.object({ id: z.string(), name: z.string() }),
  class: z.object({ id: z.string(), name: z.string() }),
  lesson: z.object({ id: z.string(), name: z.string() }),
  set: z.object({ id: z.string(), title: z.string() }),
  submittedAt: isoDate,
  late: z.boolean(),
  deadline: z.string().nullable(),
  score: z.number(),
  maxScore: z.number(),
  percent: z.number(),
  regrade: z.object({ at: isoDate, from: z.number(), to: z.number() }).nullable(),
  /** AC-20.6 labels. */
  notes: z.array(z.string()),
  rows: z.array(reviewRowSchema),
});
export type Submission = z.infer<typeof submissionSchema>;

/** T04 entry to T14 (AC-20.1): the submissions of one set in one class, newest first. */
export const setSubmissionsSchema = z.object({
  items: z.array(
    z.object({
      student: z.object({ id: z.string(), name: z.string() }),
      submittedAt: isoDate,
      late: z.boolean(),
      score: z.number(),
      maxScore: z.number(),
      percent: z.number(),
    }),
  ),
});
export type SetSubmissions = z.infer<typeof setSubmissionsSchema>;

/** T09: submissions of each set of a Bài in every class — the structure lock and its banner (AC-18.1, AC-18.2). */
export const lessonSetsSchema = z.object({
  sets: z.array(z.object({ id: z.string(), submissions: z.number() })),
});
export type LessonSets = z.infer<typeof lessonSetsSchema>;
