import { z } from 'zod';
import { classStatusSchema, learnItemSchema, sectionSchema, type Section } from './curriculum.js';
import { hskLevelSchema } from './hsk.js';
import { objectId } from './ids.js';
import { studentStatusSchema } from './accounts.js';
import { toVnParts } from './time.js';

/* Module 003 contracts: classes, members, per-class visibility and deadlines, the HV class views, wording. */

export const CLASS_LIMITS = {
  nameMax: 100,
  descriptionMax: 500,
  scheduleMax: 200,
  maxStudents: 100,
  pageSize: 20,
  /** Start dates and deadlines lie within this many days around today (AC-2.5, AC-21.2). */
  dateRangeDays: 365,
  /** Items listed in one reminder e-mail (AC-25.3). */
  reminderItems: 20,
} as const;

/** Exact UI wording of spec 003; the API sends these as `error.message` so the SPA can show them as-is. */
export const CLASS_MESSAGES = {
  nameRequired: 'Vui lòng nhập tên lớp',
  nameTooLong: 'Tên lớp tối đa 100 ký tự',
  nameTaken: 'Tên lớp đã tồn tại',
  startsNow: 'Lớp sẽ ở trạng thái Đang học ngay sau khi tạo — học viên có thể vào học ngay.',
  maxStudents: 'Một lớp có tối đa 100 học viên',
  noStudents: 'Bạn chưa có học viên nào.',
  noStudentMatch: 'Không tìm thấy học viên phù hợp',
  curriculumRequired: 'Vui lòng chọn một giáo trình',
  noPublishedLessons:
    'Giáo trình này chưa có bài nào đã xuất bản. Học viên sẽ chưa thấy bài nào cho đến khi bạn xuất bản.',
  noCurriculumMatch: 'Không có giáo trình phù hợp',
  noCurricula: 'Bạn chưa có giáo trình nào. Hãy tạo giáo trình trước để gán cho lớp.',
  emptyClassWarning: 'Lớp chưa có học viên. Bạn có thể thêm học viên sau khi tạo lớp.',
  curriculumUnavailable: 'Giáo trình đã chọn không còn khả dụng. Vui lòng chọn giáo trình khác.',
  createFailed: 'Không thể tạo lớp. Vui lòng kiểm tra kết nối và thử lại.',
  leaveTitle: 'Bỏ tạo lớp? Thông tin bạn đã nhập sẽ không được lưu.',
  noClasses: 'Bạn chưa có lớp nào. Tạo lớp đầu tiên để bắt đầu giảng dạy.',
  noClassMatch: 'Không có lớp phù hợp',
  saved: 'Đã lưu thay đổi',
  activeStartFuture:
    'Lớp đang học — chỉ có thể đổi ngày bắt đầu thành hôm nay hoặc một ngày đã qua',
  changedElsewhere: 'Lớp vừa được thay đổi ở nơi khác. Vui lòng tải lại để xem thông tin mới nhất.',
  noMembers: 'Lớp chưa có học viên.',
  curriculumLocked: 'Không thể đổi giáo trình vì học viên đã có bài nộp trong lớp này.',
  curriculumChanged: 'Đã đổi giáo trình',
  ended: 'Đã kết thúc lớp',
  reopened: 'Đã mở lại lớp',
  upcomingHint: 'Lớp chưa bắt đầu — bạn có thể xóa lớp nếu không còn cần',
  endedHint: 'Mở lại lớp để thay đổi',
  classEndedWork: 'Lớp đã kết thúc — không thể làm bài mới',
  deleteLocked: 'Không thể xóa lớp đã có bài nộp của học viên.',
  noMyClasses: 'Bạn chưa được thêm vào lớp nào. Hãy liên hệ giáo viên của bạn.',
  noLessons: 'Lớp chưa có bài nào. Giáo viên sẽ cập nhật nội dung sau.',
  noExercise: 'Chưa có bài tập',
  noContent: 'Chưa có nội dung',
  exercisesClosed: 'Bài tập chưa mở',
  notMember: 'Bạn không thuộc lớp này hoặc lớp không còn tồn tại',
  visibilityFailed: 'Không thể cập nhật hiển thị nội dung. Vui lòng thử lại.',
  contentUnavailable: 'Nội dung này hiện không khả dụng.',
  workUnavailable: 'Bài tập này hiện không khả dụng. Câu trả lời đã lưu của bạn được giữ lại.',
  setClosedWork: 'Bộ bài tập chưa mở. Giáo viên chưa đặt hạn nộp.',
  lessonEmpty: 'Bài này chưa có nội dung. Giáo viên sẽ cập nhật sau.',
  noTeacherDeadline: 'Giáo viên chưa đặt hạn nộp',
  aloneInClass: 'Lớp chưa có thành viên nào khác.',
  deadlineFailed: 'Không thể cập nhật hạn nộp. Vui lòng thử lại.',
  pastDeadlineWarning:
    'Ngày đã qua — học viên chưa làm sẽ thấy “Quá hạn” ngay và không có thư nhắc.',
  noReminderWarning: 'Học viên sẽ không nhận email nhắc cho hạn nộp này.',
  clearDeadlineWarning:
    'Xóa hạn sẽ đóng bộ bài tập với học viên lớp này: ai chưa nộp sẽ thấy “Chưa mở” và không làm được; bài đã nộp và điểm được giữ.',
  deadlineCleared: 'Đã xóa hạn nộp. Bộ bài tập chuyển sang “Chưa mở” với học viên.',
  hiddenDeadlinesNote: 'Hạn nộp được giữ nhưng không gửi nhắc khi phần đang ẩn.',
  closedForStudents: 'Chưa mở với học viên',
  setDeadline: 'Đặt hạn',
  pickDeadline: 'Chọn ngày hạn nộp',
} as const;

export const CLASS_ERROR_CODES = {
  CLASS_NAME_TAKEN: 'CLASS_NAME_TAKEN',
  CURRICULUM_UNAVAILABLE: 'CURRICULUM_UNAVAILABLE',
  STUDENTS_MISSING: 'STUDENTS_MISSING',
  CLASS_FULL: 'CLASS_FULL',
  CLASS_ENDED: 'CLASS_ENDED',
  CLASS_NOT_ACTIVE: 'CLASS_NOT_ACTIVE',
  ACTIVE_START_FUTURE: 'ACTIVE_START_FUTURE',
  HAS_SUBMISSIONS: 'HAS_SUBMISSIONS',
  ALREADY_IN_STATE: 'ALREADY_IN_STATE',
  CLASS_NOT_MEMBER: 'CLASS_NOT_MEMBER',
  CLASS_NOT_STARTED: 'CLASS_NOT_STARTED',
  CONTENT_UNAVAILABLE: 'CONTENT_UNAVAILABLE',
  WORK_UNAVAILABLE: 'WORK_UNAVAILABLE',
} as const;

/* ---------- VN calendar days ('YYYY-MM-DD') ---------- */

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** The VN calendar day of an instant. */
export function vnDay(date: Date): string {
  const p = toVnParts(date);
  return `${String(p.year).padStart(4, '0')}-${pad(p.month)}-${pad(p.day)}`;
}

const dayParts = (day: string) => day.split('-').map(Number) as [number, number, number];

/** 00:00 Vietnam time of `day`, as a UTC instant. */
export function vnDayStart(day: string): Date {
  const [y, m, d] = dayParts(day);
  return new Date(Date.UTC(y, m - 1, d) - VN_OFFSET_MS);
}

/** 23:59:59.999 Vietnam time of `day` — the deadline instant (AC-21.3). */
export function vnDayEnd(day: string): Date {
  return new Date(vnDayStart(day).getTime() + DAY_MS - 1);
}

export function addVnDays(day: string, n: number): string {
  return vnDay(new Date(vnDayStart(day).getTime() + n * DAY_MS));
}

/** dd/MM/yyyy */
export function formatDay(day: string): string {
  const [y, m, d] = dayParts(day);
  return `${pad(d)}/${pad(m)}/${y}`;
}

const isRealDay = (day: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = dayParts(day);
  const u = new Date(Date.UTC(y, m - 1, d));
  return u.getUTCFullYear() === y && u.getUTCMonth() === m - 1 && u.getUTCDate() === d;
};
export const daySchema = z.string().refine(isRealDay, { error: 'Invalid day' });

/** [first, last] allowed day around `today` (AC-2.5, AC-21.2). */
export const dayRange = (today: string): [string, string] => [
  addVnDays(today, -CLASS_LIMITS.dateRangeDays),
  addVnDays(today, CLASS_LIMITS.dateRangeDays),
];

export const startDateRangeMessage = (today: string): string => {
  const [from, to] = dayRange(today);
  return `Vui lòng chọn ngày bắt đầu từ ${formatDay(from)} đến ${formatDay(to)}`;
};

/* ---------- class status (AC-14.1) ---------- */

export type ClassStatus = z.infer<typeof classStatusSchema>;

export function classStatusOf(
  c: { startDate: string; endDate: string | null },
  today: string,
): ClassStatus {
  if (c.endDate) return 'ended';
  return today < c.startDate ? 'upcoming' : 'active';
}

/* ---------- learner exercise status (AC-19.3, 005 AC-17.5) ---------- */

export const LEARNER_SET_STATUSES = ['done', 'closed', 'overdue', 'doing', 'todo'] as const;
export const learnerSetStatusSchema = z.enum(LEARNER_SET_STATUSES);
export type LearnerSetStatus = z.infer<typeof learnerSetStatusSchema>;
export const LEARNER_SET_LABELS: Record<LearnerSetStatus, string> = {
  done: 'Đã hoàn thành',
  closed: 'Chưa mở',
  overdue: 'Quá hạn',
  doing: 'Đang làm',
  todo: 'Chưa làm',
};

/**
 * Status of one set for one HV in one class. `deadline` is the effective deadline day (null = not open);
 * the priority is Đã hoàn thành › Chưa mở › Quá hạn › Đang làm › Chưa làm, and "Quá hạn" only while the class is active.
 */
export function learnerSetStatus(input: {
  deadline: string | null;
  submitted: boolean;
  inProgress: boolean;
  classStatus: ClassStatus;
  now: Date;
}): LearnerSetStatus {
  if (input.submitted) return 'done';
  if (!input.deadline) return 'closed';
  if (input.classStatus === 'active' && input.now > vnDayEnd(input.deadline)) return 'overdue';
  return input.inProgress ? 'doing' : 'todo';
}

/** "Hạn hôm nay" or "Hạn nộp dd/MM" (dd/MM/yyyy in another year) — AC-23.1, AC-23.2, AC-23.6. */
export function deadlineLabel(input: {
  deadline: string;
  today: string;
  submitted: boolean;
  classStatus: ClassStatus;
}): string {
  if (input.classStatus === 'active' && !input.submitted && input.deadline === input.today)
    return 'Hạn hôm nay';
  const [y, m, d] = dayParts(input.deadline);
  const sameYear = y === dayParts(input.today)[0];
  return `Hạn nộp ${pad(d)}/${pad(m)}${sameYear ? '' : `/${y}`}`;
}

/* ---------- wording helpers ---------- */

export const createdMessage = (name: string) => `Đã tạo lớp «${name}»`;
export const deletedMessage = (name: string) => `Đã xóa lớp «${name}»`;
export const studentsRemovedMessage = (n: number) =>
  `${n} học viên đã bị xóa khỏi workspace và đã được bỏ chọn`;
export const seatsLeftMessage = (k: number) => `Lớp chỉ còn chỗ cho ${k} học viên (tối đa 100)`;
export const addedMessage = (n: number) => `Đã thêm ${n} học viên vào lớp`;
export const removeConfirm = (student: string, cls: string) =>
  `Gỡ ${student} khỏi lớp ${cls}? Học viên sẽ không còn thấy lớp này.`;
export const changeCurriculumConfirm = (cls: string, curriculum: string) =>
  `Đổi giáo trình của lớp ${cls} sang ${curriculum}? Học viên sẽ thấy các bài của giáo trình mới; tiến độ theo giáo trình cũ không còn được tính cho lớp này và thiết lập ẩn/hiện nội dung của lớp sẽ được đặt lại.`;
export const endConfirm = (cls: string) =>
  `Kết thúc lớp ${cls}? Học viên sẽ chỉ xem lại được bài học và kết quả, không thể làm bài tập mới. Bạn có thể mở lại lớp sau.`;
export const deleteConfirm = (cls: string, n: number) =>
  `Xóa lớp ${cls}? Lớp có ${n} học viên. Thao tác này không thể hoàn tác.`;
export const upcomingMessage = (startDate: string) =>
  `Lớp sẽ bắt đầu vào ngày ${formatDay(startDate)}. Nội dung sẽ mở từ ngày này.`;
export const endedBanner = (endDate: string) =>
  `Lớp đã kết thúc ngày ${formatDay(endDate)}. Bạn có thể xem lại bài học và kết quả, nhưng không thể làm bài mới.`;
export const startsOnLine = (startDate: string) => `Bắt đầu ngày ${formatDay(startDate)}`;
export const progressText = (done: number, total: number) => `${done}/${total} bộ bài tập`;

export const SECTION_NAMES: Record<Section, string> = { lesson: 'Bài học', exercise: 'Bài tập' };
export const hideConfirm = (section: string, lesson: string, cls: string) =>
  `Ẩn «${section}» của «${lesson}» với lớp ${cls}? Học viên của lớp này sẽ không còn thấy phần này, kể cả kết quả đã làm. Điểm xếp hạng đã có được giữ nguyên. Các lớp khác dùng giáo trình này không bị ảnh hưởng. Bạn có thể hiện lại bất cứ lúc nào.`;
export const showConfirm = (section: string, lesson: string, cls: string) =>
  `Hiện lại «${section}» của «${lesson}» với lớp ${cls}? Học viên sẽ thấy lại phần này cùng toàn bộ kết quả đã làm trước đây.`;
export const inProgressLine = (n: number) =>
  `${n} học viên đang làm dở bài tập trong phần này — câu trả lời đã lưu được giữ lại nhưng không nộp được cho tới khi bạn hiện lại.`;
export const hiddenMessage = (section: string, lesson: string) =>
  `Đã ẩn «${section}» của «${lesson}» với lớp`;
export const shownMessage = (section: string, lesson: string) =>
  `Đã hiện «${section}» của «${lesson}» với lớp`;
export const bulkUpdatedMessage = (k: number) => `Đã cập nhật ${k} phần`;
export const alreadyInStateMessage = (hidden: boolean) =>
  `Phần này đã ở trạng thái «${hidden ? 'Đang ẩn' : 'Hiển thị'}».`;
export const contentSummary = (lessons: number, hidden: number) =>
  `${lessons} bài · ${hidden} phần đang ẩn với lớp này`;
export const deadlineLine = (day: string) => `Hạn nộp: 23:59 ${formatDay(day)}`;
export const deadlineSetMessage = (day: string, count?: number) =>
  `Đã đặt hạn nộp 23:59 ${formatDay(day)}${count === undefined ? '' : ` cho ${count} bộ bài tập`}. Nhắc học viên chưa làm lúc 08:00 ngày hạn.`;
export const pastDeadlineSetMessage = (day: string) =>
  `Đã đặt hạn ${formatDay(day)} — ngày đã qua: học viên chưa làm thấy “Quá hạn”, không gửi nhắc.`;
export const bulkDeadlineClearedMessage = (k: number) =>
  `Đã xóa hạn nộp của ${k} bộ bài tập. Các bộ này chuyển sang “Chưa mở” với học viên.`;

/* ---------- requests ---------- */

const trimmedName = z
  .string({ error: CLASS_MESSAGES.nameRequired })
  .trim()
  .pipe(
    z
      .string()
      .min(1, { error: CLASS_MESSAGES.nameRequired })
      .max(CLASS_LIMITS.nameMax, { error: CLASS_MESSAGES.nameTooLong }),
  );
export const classNameSchema = trimmedName;
export const classDescriptionSchema = z.string().trim().max(CLASS_LIMITS.descriptionMax);
export const classScheduleSchema = z.string().trim().max(CLASS_LIMITS.scheduleMax);

export const createClassBodySchema = z.object({
  name: classNameSchema,
  startDate: daySchema,
  description: classDescriptionSchema.default(''),
  schedule: classScheduleSchema.default(''),
  curriculumId: objectId,
  studentIds: z.array(objectId).max(CLASS_LIMITS.maxStudents).default([]),
  /** One per wizard run: the same key creates at most one class (AC-5.6). */
  createKey: z.string().min(8).max(64),
});
export type CreateClassBody = z.input<typeof createClassBodySchema>;

export const patchClassBodySchema = z.object({
  expectedVersion: z.number().int().min(1),
  name: classNameSchema.optional(),
  startDate: daySchema.optional(),
  description: classDescriptionSchema.optional(),
  schedule: classScheduleSchema.optional(),
});
export type PatchClassBody = z.input<typeof patchClassBodySchema>;

export const CLASS_FILTERS = ['live', 'upcoming', 'active', 'ended', 'all'] as const;
export const classFilterSchema = z.enum(CLASS_FILTERS);
export type ClassFilter = z.infer<typeof classFilterSchema>;

export const classListQuerySchema = z.object({
  status: classFilterSchema.default('live'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type ClassListQuery = z.input<typeof classListQuerySchema>;

export const studentOptionsQuerySchema = z.object({
  q: z.string().trim().max(254).optional(),
  page: z.coerce.number().int().min(1).default(1),
  classId: objectId.optional(),
});
export const nameAvailableQuerySchema = z.object({
  name: z.string().max(500),
  excludeId: objectId.optional(),
});
export const studentIdsBodySchema = z.object({
  studentIds: z.array(objectId).min(1).max(CLASS_LIMITS.maxStudents),
});
export const changeCurriculumBodySchema = z.object({ curriculumId: objectId });

export const visibilityScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('section'), lessonId: objectId, section: sectionSchema }),
  z.object({ kind: z.literal('column'), section: sectionSchema }),
  z.object({ kind: z.literal('lesson'), lessonId: objectId }),
]);
export type VisibilityScope = z.infer<typeof visibilityScopeSchema>;
export const visibilityBodySchema = z.object({ hidden: z.boolean(), scope: visibilityScopeSchema });
export type VisibilityBody = z.infer<typeof visibilityBodySchema>;

export const deadlineTargetSchema = z.union([
  z.object({ setId: objectId }),
  z.object({ lessonId: objectId }),
]);
export const deadlineBodySchema = z.object({
  target: deadlineTargetSchema,
  /** null clears the deadline (AC-21.6, AC-22.2). */
  date: daySchema.nullable(),
});
export type DeadlineBody = z.infer<typeof deadlineBodySchema>;

/* ---------- responses (GV) ---------- */

const curriculumRef = z.object({ id: z.string(), name: z.string(), hsk: hskLevelSchema });

export const classRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: classStatusSchema,
  startDate: z.string(),
  curriculum: curriculumRef.nullable(),
  memberCount: z.number(),
  createdAt: z.string(),
});
export type ClassRow = z.infer<typeof classRowSchema>;

export const classListResponseSchema = z.object({
  items: z.array(classRowSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  counts: z.record(classFilterSchema, z.number()),
});
export type ClassListResponse = z.infer<typeof classListResponseSchema>;

export const classDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: classStatusSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string(),
  schedule: z.string(),
  createdAt: z.string(),
  version: z.number(),
  memberCount: z.number(),
  today: z.string(),
  curriculum: curriculumRef.extend({ publishedLessonCount: z.number(), archived: z.boolean() }),
  hiddenCount: z.number(),
  /** A submission of an exercise set (blocks the curriculum change — AC-9.3). */
  hasExerciseSubmissions: z.boolean(),
  /** Any submission, exercise or exam (blocks deletion — AC-11.3). */
  hasSubmissions: z.boolean(),
});
export type ClassDetail = z.infer<typeof classDetailSchema>;

export const studentOptionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  status: studentStatusSchema,
  inClass: z.boolean(),
});
export type StudentOption = z.infer<typeof studentOptionSchema>;
export const studentOptionsResponseSchema = z.object({
  items: z.array(studentOptionSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  workspaceTotal: z.number(),
});
export type StudentOptionsResponse = z.infer<typeof studentOptionsResponseSchema>;

export const curriculumOptionSchema = curriculumRef.extend({
  publishedLessonCount: z.number(),
  usedBy: z.number(),
});
export type CurriculumOption = z.infer<typeof curriculumOptionSchema>;
export const curriculumOptionsResponseSchema = z.object({ items: z.array(curriculumOptionSchema) });

export const classMemberSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  status: studentStatusSchema,
  joinedAt: z.string(),
  avatarUrl: z.string().nullable(),
});
export type ClassMember = z.infer<typeof classMemberSchema>;
export const classMembersResponseSchema = z.object({
  items: z.array(classMemberSchema),
  memberCount: z.number(),
});
export const addStudentsResponseSchema = z.object({ added: z.number(), memberCount: z.number() });

export const contentSetSchema = z.object({
  id: z.string(),
  title: z.string(),
  deadline: z.string().nullable(),
});
export const contentLessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'published']),
  sections: z.object({
    lesson: z.object({ publishedCount: z.number(), hidden: z.boolean() }),
    exercise: z.object({ publishedCount: z.number(), hidden: z.boolean() }),
  }),
  /** Published sets of the Bài tập section, in order, with this class's deadline. */
  sets: z.array(contentSetSchema),
});
export type ContentLesson = z.infer<typeof contentLessonSchema>;
export const classContentSchema = z.object({
  curriculum: z.object({ id: z.string(), name: z.string() }),
  status: classStatusSchema,
  startDate: z.string(),
  today: z.string(),
  /** VN hour:minute now, for the "after 08:00" warning (AC-21.5). */
  nowMinutes: z.number(),
  hiddenCount: z.number(),
  lessons: z.array(contentLessonSchema),
});
export type ClassContent = z.infer<typeof classContentSchema>;
export const visibilityPreviewSchema = z.object({ changes: z.number(), inProgress: z.number() });
export const contentChangeResponseSchema = z.object({
  changed: z.number(),
  content: classContentSchema,
});

/* ---------- responses (HV) ---------- */

export const progressSchema = z.object({ done: z.number(), total: z.number() });
export type Progress = z.infer<typeof progressSchema>;

/** What replaces a Bài's progress: no visible set, nothing visible, sets visible but none open (AC-13.4, AC-13.7). */
export const lessonLabelSchema = z.enum(['noExercise', 'noContent', 'closed']).nullable();
export const LESSON_LABELS = {
  noExercise: CLASS_MESSAGES.noExercise,
  noContent: CLASS_MESSAGES.noContent,
  closed: CLASS_MESSAGES.exercisesClosed,
} as const;

export const myClassCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: classStatusSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  curriculum: z.object({ name: z.string(), hsk: hskLevelSchema }),
  progress: progressSchema.nullable(),
});
export type MyClassCard = z.infer<typeof myClassCardSchema>;
export const myClassesResponseSchema = z.object({ items: z.array(myClassCardSchema) });

export const myLessonRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  sections: z.array(sectionSchema),
  progress: progressSchema.nullable(),
  label: lessonLabelSchema,
});
export type MyLessonRow = z.infer<typeof myLessonRowSchema>;

export const myClassPageSchema = myClassCardSchema.extend({
  schedule: z.string(),
  /** null while the class is upcoming (AC-14.3). */
  lessons: z.array(myLessonRowSchema).nullable(),
  memberCount: z.number().nullable(),
  examCount: z.number(),
});
export type MyClassPage = z.infer<typeof myClassPageSchema>;

export const classmateSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  me: z.boolean(),
});
export type Classmate = z.infer<typeof classmateSchema>;
export const classmatesResponseSchema = z.object({ items: z.array(classmateSchema) });

export const learnerSetSchema = z.object({
  id: z.string(),
  title: z.string(),
  questionCount: z.number(),
  status: learnerSetStatusSchema,
  score: z.number().nullable(),
  maxScore: z.number().nullable(),
  late: z.boolean(),
  /** Effective deadline label ("Hạn nộp 25/10", "Hạn hôm nay"); null without one. */
  deadlineLabel: z.string().nullable(),
});
export type LearnerSet = z.infer<typeof learnerSetSchema>;

export const lessonUnitSchema = z.object({
  classId: z.string(),
  className: z.string(),
  classStatus: classStatusSchema,
  endDate: z.string().nullable(),
  lesson: z.object({ id: z.string(), name: z.string() }),
  progress: progressSchema.nullable(),
  label: lessonLabelSchema,
  steps: z.array(z.object({ id: z.string(), title: z.string() })),
  sets: z.array(learnerSetSchema),
});
export type LessonUnit = z.infer<typeof lessonUnitSchema>;

/** One item opened from S11 (S03 / S05 of 004 / 005 build on it). */
export const classItemSchema = z.object({
  item: learnItemSchema,
  lessonId: z.string(),
  classStatus: classStatusSchema,
  set: learnerSetSchema
    .extend({ canWork: z.boolean(), blockedReason: z.string().nullable() })
    .nullable(),
});
export type ClassItem = z.infer<typeof classItemSchema>;

/** `details` of a refused HV request: the message to show and where to go (AC-14.5, AC-17.5, AC-18.1). */
export const refusalDetailsSchema = z.object({ back: z.string() });
