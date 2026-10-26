import { z } from 'zod';
import { type HskLevel, hskLevelSchema } from './hsk.js';
import { objectId } from './ids.js';
import {
  type StepContent,
  newStepContent,
  stepContentSchema,
  stepNotReadyReason,
} from './steps.js';
import { normalizeSpaces } from './text.js';

/* Module 002 contracts: curricula, Bài, items (steps / sets), the HV view and user-facing wording. */

export const CURRICULUM_LIMITS = {
  nameMax: 100,
  descriptionMax: 2000,
  lessonsPerCurriculum: 100,
  itemsPerSection: 30,
  coverMaxBytes: 2 * 1024 * 1024,
  pageSize: 20,
  itemTitleMax: 200,
} as const;

export const COVER_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Exact UI wording of spec 002; the API sends these as `error.message` so the SPA can show them as-is. */
export const CURRICULUM_MESSAGES = {
  nameRequired: 'Vui lòng nhập tên giáo trình',
  nameTooLong: 'Tên giáo trình tối đa 100 ký tự',
  nameTaken: 'Tên giáo trình đã tồn tại',
  hskRequired: 'Vui lòng chọn cấp độ HSK',
  descriptionTooLong: 'Mô tả tối đa 2000 ký tự',
  invalidCover: 'Ảnh bìa phải là JPG, PNG hoặc WebP, tối đa 2 MB',
  created: 'Đã tạo giáo trình',
  saved: 'Đã lưu thay đổi',
  emptyList: 'Bạn chưa có giáo trình nào',
  noMatch: 'Không tìm thấy giáo trình phù hợp',
  noLessons: 'Giáo trình chưa có bài nào',
  noClasses: 'Chưa có lớp nào.',
  lessonNameRequired: 'Vui lòng nhập tên bài',
  lessonNameTooLong: 'Tên bài tối đa 100 ký tự',
  lessonAdded: 'Đã thêm bài',
  lessonRenamed: 'Đã đổi tên bài',
  lessonLimit: 'Mỗi giáo trình tối đa 100 bài',
  orderSaved: 'Đã cập nhật thứ tự',
  orderFailed: 'Không lưu được thứ tự. Vui lòng thử lại.',
  noStepsYet: 'Chưa có bước học nào',
  noSetsYet: 'Chưa có bộ bài tập nào',
  needOneReady: 'Cần ít nhất một mục sẵn sàng để xuất bản bài',
  lessonPublished: 'Đã xuất bản bài',
  noVisibleContent: 'Bài đã xuất bản nhưng chưa có nội dung hiển thị cho học viên',
  notFound: 'Không tìm thấy nội dung bạn yêu cầu.',
  deleted: 'Đã xóa · Đã lưu',
  setHasData: 'Bộ bài tập đã có dữ liệu học tập nên không xóa được — hãy Lưu trữ.',
  lessonHasData:
    'Không thể xóa bài vì học viên đã có dữ liệu học tập. Bạn có thể lưu trữ từng bước học, bộ bài tập, hoặc ẩn từng phần của bài ở từng lớp (Chi tiết lớp → Nội dung).',
  lessonDeleted: 'Đã xóa bài',
  lessonAiWarning: 'Bài có nội dung AI đang tạo hoặc chờ duyệt. Xóa bài sẽ hủy nội dung này.',
  curriculumDeleted: 'Đã xóa giáo trình',
  curriculumHasData:
    'Không thể xóa: học viên đã có dữ liệu học tập trong giáo trình này. Bạn có thể lưu trữ giáo trình.',
  curriculumArchived: 'Đã lưu trữ giáo trình — các lớp đang dùng vẫn hiển thị nội dung như trước.',
  curriculumRestored: 'Đã khôi phục giáo trình.',
  lessonDuplicated: 'Đã nhân bản bài',
  curriculumDuplicated: 'Đã nhân bản giáo trình',
  duplicateFailed: 'Nhân bản không thành công. Vui lòng thử lại.',
  duplicating: 'Đang nhân bản…',
  archivedItem: 'Đã lưu trữ · Đã lưu',
  restoredItem: 'Đã khôi phục · Đã lưu',
  saveBeforeArchive: 'Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ',
  changedElsewhere: 'Dữ liệu đã thay đổi ở nơi khác. Vui lòng kiểm tra lại.',
  sectionChanged: 'Nội dung của phần đã thay đổi. Vui lòng kiểm tra lại.',
  wrongSection: 'Không thể chuyển mục sang phần khác của bài.',
  keptScores: 'Bài làm và điểm của học viên được giữ lại.',
  leaveBody: 'Các thay đổi chưa lưu sẽ bị bỏ; nội dung đã lưu không đổi.',
  draftLessonNotice:
    'Bài đang ở trạng thái Nháp — học viên chưa thấy bài này cho tới khi bài được xuất bản.',
  previewNote: 'Không ghi nhận lượt làm, bài nộp hay điểm',
  noPublishedSteps: 'Bài chưa có bước học nào đã xuất bản.',
  noPublishedSets: 'Bài chưa có bộ bài tập nào đã xuất bản.',
} as const;

export const CURRICULUM_ERROR_CODES = {
  NAME_TAKEN: 'NAME_TAKEN',
  INVALID_COVER: 'INVALID_COVER',
  LESSON_LIMIT: 'LESSON_LIMIT',
  ITEM_LIMIT: 'ITEM_LIMIT',
  NOT_READY: 'NOT_READY',
  HAS_LEARNING_DATA: 'HAS_LEARNING_DATA',
  IN_USE: 'IN_USE',
  COPY_IN_PROGRESS: 'COPY_IN_PROGRESS',
  COPY_FAILED: 'COPY_FAILED',
  WRONG_SECTION: 'WRONG_SECTION',
  TOO_MANY_ITEMS: 'TOO_MANY_ITEMS',
  SECTION_CHANGED: 'SECTION_CHANGED',
} as const;

/* ---------- wording helpers ---------- */

export const SECTIONS = ['lesson', 'exercise'] as const;
export const sectionSchema = z.enum(SECTIONS);
export type Section = z.infer<typeof sectionSchema>;

/** 'Bài học' / 'Bài tập' (tab and section names). */
export const SECTION_TITLES: Record<Section, string> = { lesson: 'Bài học', exercise: 'Bài tập' };
/** 'bước học' / 'bộ bài tập' (item noun). */
export const ITEM_NOUNS: Record<Section, string> = { lesson: 'bước học', exercise: 'bộ bài tập' };

export const itemLimitMessage = (section: Section): string =>
  `Mỗi bài có tối đa 30 ${ITEM_NOUNS[section]}.`;
export const approveLimitMessage = (section: Section): string =>
  `Mỗi bài có tối đa 30 ${ITEM_NOUNS[section]}. Hãy xóa bớt mục trong review rồi duyệt lại.`;
export const itemAddedMessage = (section: Section): string =>
  `Đã thêm ${ITEM_NOUNS[section]} mới (Nháp) · Đã lưu`;
export const itemMovedMessage = (position: number, total: number): string =>
  `Đã chuyển tới vị trí ${position}/${total} · Đã lưu`;
export const notReadyMessage = (reason: string): string =>
  `Không thể xuất bản — Chưa hoàn chỉnh: ${reason}`;
export const usedByNotice = (n: number): string =>
  `Giáo trình đang được dùng bởi ${n} lớp. Thay đổi với nội dung đã xuất bản sẽ hiển thị ngay cho học viên các lớp này.`;
export const hskChangeConfirm = (n: number): string =>
  `Giáo trình đang được dùng bởi ${n} lớp. Bạn có chắc muốn đổi cấp độ HSK?`;
export const inUseMessage = (n: number): string =>
  `Không thể xóa: giáo trình đang được dùng bởi ${n} lớp.`;
export const publishWarning = (n: number): string =>
  `Bài sẽ hiển thị với học viên của ${n} lớp (trừ các phần đang ẩn ở từng lớp).`;
export const approveWarning = (n: number): string =>
  `Nội dung mới sẽ hiển thị ngay với học viên của ${n} lớp (trừ các phần đang ẩn ở từng lớp).`;
export const leaveQuestion = (k: number): string =>
  `Có ${k} mục chưa lưu. Rời trang và bỏ các thay đổi này?`;
export const positionAnnouncement = (position: number, total: number): string =>
  `Vị trí ${position} trên ${total}`;

/** ' (bản sao)' suffix; the original part is cut so the whole stays ≤ 100 characters (AC-14.1, AC-15.1). */
export function copyName(original: string, n = 1): string {
  const suffix = n > 1 ? ` (bản sao ${n})` : ' (bản sao)';
  return (
    [...original]
      .slice(0, CURRICULUM_LIMITS.nameMax - suffix.length)
      .join('')
      .trimEnd() + suffix
  );
}

/* ---------- item content (steps: 004 `steps.ts`; sets: interim until 005 ships) ---------- */

export const mcqSchema = z.object({
  type: z.literal('mcq'),
  prompt: z.string().max(2000),
  options: z.array(z.string().max(500)).min(2).max(6),
  answer: z.number().int().min(0).max(5).nullable(),
});
export type McqQuestion = z.infer<typeof mcqSchema>;
export const setContentSchema = z.object({ questions: z.array(mcqSchema).max(100) });
export type SetContent = z.infer<typeof setContentSchema>;

export type ItemContent = StepContent | SetContent;

/** A new step: one empty text block (004); a new set: one sample multiple-choice question (AC-7.6). */
export function newItemContent(section: Section): ItemContent {
  return section === 'lesson'
    ? newStepContent()
    : { questions: [{ type: 'mcq', prompt: '', options: ['', '', '', ''], answer: null }] };
}

export const contentSchemaFor = (section: Section) =>
  section === 'lesson' ? stepContentSchema : setContentSchema;

const blank = (s: string) => s.trim() === '';

/** Why an item cannot be published yet (AC-9.2), or null when it is ready. Content is checked before the title. */
export function itemNotReadyReason(
  section: Section,
  title: string,
  content: unknown,
): string | null {
  if (section === 'lesson') return stepNotReadyReason(title, content);
  const parsed = setContentSchema.safeParse(content);
  const questions = parsed.success ? parsed.data.questions : [];
  if (!questions.length) return 'mục trống';
  for (const [i, q] of questions.entries()) {
    const n = i + 1;
    if (blank(q.prompt)) return `Câu ${n}: chưa có nội dung câu hỏi`;
    if (q.options.filter((o) => !blank(o)).length < 2) return `Câu ${n}: cần ít nhất 2 phương án`;
    if (q.answer === null || blank(q.options[q.answer] ?? ''))
      return `Câu ${n}: chưa chọn đáp án đúng`;
  }
  return blank(title) ? 'Chưa có tên bộ bài tập' : null;
}

/* ---------- field rules ---------- */

const nameField = (required: string, tooLong: string) =>
  z
    .string({ error: required })
    .transform(normalizeSpaces)
    .pipe(
      z.string().min(1, { error: required }).max(CURRICULUM_LIMITS.nameMax, { error: tooLong }),
    );

export const curriculumNameSchema = nameField(
  CURRICULUM_MESSAGES.nameRequired,
  CURRICULUM_MESSAGES.nameTooLong,
);
export const lessonNameSchema = nameField(
  CURRICULUM_MESSAGES.lessonNameRequired,
  CURRICULUM_MESSAGES.lessonNameTooLong,
);
export const curriculumHskSchema = z.custom<HskLevel>((v) => hskLevelSchema.safeParse(v).success, {
  error: CURRICULUM_MESSAGES.hskRequired,
});
export const descriptionSchema = z
  .string()
  .trim()
  .max(CURRICULUM_LIMITS.descriptionMax, { error: CURRICULUM_MESSAGES.descriptionTooLong });

const versionSchema = z.number().int().min(1);

/* ---------- requests ---------- */

export const curriculumBodySchema = z.object({
  name: curriculumNameSchema,
  hsk: curriculumHskSchema,
  description: descriptionSchema.default(''),
  coverFileId: objectId.nullable().optional(),
});
export type CurriculumBody = z.input<typeof curriculumBodySchema>;

export const curriculumPatchSchema = z.object({
  expectedVersion: versionSchema,
  name: curriculumNameSchema.optional(),
  hsk: curriculumHskSchema.optional(),
  description: descriptionSchema.optional(),
  coverFileId: objectId.nullable().optional(),
});
export type CurriculumPatch = z.input<typeof curriculumPatchSchema>;

export const duplicateCurriculumBodySchema = z.object({
  name: curriculumNameSchema,
  hsk: curriculumHskSchema,
});

export const curriculumListQuerySchema = z.object({
  hsk: z.coerce.number().pipe(hskLevelSchema).optional(),
  q: z.string().max(200).optional(),
  archived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  /** Active curricula a class can use (T03 of 003). */
  selectable: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export const lessonNameBodySchema = z.object({ name: lessonNameSchema });
export const lessonRenameBodySchema = z.object({
  expectedVersion: versionSchema,
  name: lessonNameSchema,
});
export const lessonOrderBodySchema = z.object({
  expectedOrder: z.array(objectId).max(CURRICULUM_LIMITS.lessonsPerCurriculum),
  order: z.array(objectId).max(CURRICULUM_LIMITS.lessonsPerCurriculum),
});
export const addItemBodySchema = z.object({
  section: sectionSchema,
  afterItemId: objectId.optional(),
});
export const saveItemBodySchema = z.object({
  expectedVersion: versionSchema,
  title: z.string().trim().max(CURRICULUM_LIMITS.itemTitleMax),
  content: z.unknown(),
});
export type SaveItemBody = z.input<typeof saveItemBodySchema>;
export const itemVersionBodySchema = z.object({ expectedVersion: versionSchema });
export const moveItemBodySchema = z.object({
  direction: z.enum(['up', 'down']),
  /** Ids of the item's section in the order the client shows (stale → 409). */
  expectedOrder: z.array(objectId).max(500),
});
export const publishLessonBodySchema = z.object({
  expectedVersion: versionSchema,
  itemIds: z.array(objectId).max(60),
});

/* ---------- responses ---------- */

const isoDate = z.string();

export const lessonStatusSchema = z.enum(['draft', 'published']);
export type LessonStatus = z.infer<typeof lessonStatusSchema>;
export const itemStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

/** AI label of a Bài, provided by 010 (AC-11.3). */
export const aiLabelSchema = z.object({
  state: z.enum(['generating', 'review']),
  label: z.string(),
});
export type AiLabel = z.infer<typeof aiLabelSchema>;

export const classStatusSchema = z.enum(['upcoming', 'active', 'ended']);
export const CLASS_STATUS_LABELS = {
  upcoming: 'Sắp bắt đầu',
  active: 'Đang học',
  ended: 'Đã kết thúc',
} as const;
export const usingClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: classStatusSchema,
  startDate: z.string(),
});
export type UsingClass = z.infer<typeof usingClassSchema>;

export const curriculumCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  hsk: hskLevelSchema,
  description: z.string(),
  coverUrl: z.string().nullable(),
  archived: z.boolean(),
  lessonCount: z.number(),
  publishedLessonCount: z.number(),
  usedBy: z.number(),
  updatedAt: isoDate,
});
export type CurriculumCard = z.infer<typeof curriculumCardSchema>;

export const curriculumListResponseSchema = z.object({
  items: z.array(curriculumCardSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  /** Per-level counts for the filter chips; `all` = every curriculum of the current tab (active / archived). */
  levelCounts: z.record(z.string(), z.number()),
});
export type CurriculumListResponse = z.infer<typeof curriculumListResponseSchema>;

export const lessonRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: lessonStatusSchema,
  stepCount: z.number(),
  setCount: z.number(),
  draftCount: z.number(),
  publishedItemCount: z.number(),
  hasLearningData: z.boolean(),
  ai: aiLabelSchema.nullable(),
  updatedAt: isoDate,
  version: z.number(),
});
export type LessonRow = z.infer<typeof lessonRowSchema>;

export const curriculumDetailSchema = curriculumCardSchema.extend({
  version: z.number(),
  coverFileId: z.string().nullable(),
  lessons: z.array(lessonRowSchema),
});
export type CurriculumDetail = z.infer<typeof curriculumDetailSchema>;

export const usingClassesResponseSchema = z.object({ items: z.array(usingClassSchema) });

export const itemSchema = z.object({
  id: z.string(),
  section: sectionSchema,
  title: z.string(),
  status: itemStatusSchema,
  /** "AI tạo" — GV only (AC-11.7). */
  ai: z.boolean(),
  content: z.unknown(),
  version: z.number(),
  updatedAt: isoDate,
  notReady: z.string().nullable(),
  hasLearningData: z.boolean(),
});
export type Item = z.infer<typeof itemSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  curriculumId: z.string(),
  curriculumName: z.string(),
  name: z.string(),
  status: lessonStatusSchema,
  version: z.number(),
  /** 1-based number of the Bài in its curriculum and the number of Bài. */
  position: z.number(),
  lessonCount: z.number(),
  usedBy: z.number(),
  items: z.array(itemSchema),
  ai: aiLabelSchema.nullable(),
  hasLearningData: z.boolean(),
  updatedAt: isoDate,
  sectionUpdatedAt: z.object({ lesson: isoDate.nullable(), exercise: isoDate.nullable() }),
});
export type Lesson = z.infer<typeof lessonSchema>;

/* ---------- HV view (REQ-10) ---------- */

export const learnItemSchema = z.object({
  id: z.string(),
  section: sectionSchema,
  title: z.string(),
  content: z.unknown(),
});
export type LearnItem = z.infer<typeof learnItemSchema>;

export const learnLessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  sections: z.object({ lesson: z.array(learnItemSchema), exercise: z.array(learnItemSchema) }),
});
export type LearnLesson = z.infer<typeof learnLessonSchema>;

export const learnCurriculumSchema = z.object({
  id: z.string(),
  name: z.string(),
  hsk: hskLevelSchema,
  description: z.string(),
  coverUrl: z.string().nullable(),
  lessons: z.array(learnLessonSchema),
});
export type LearnCurriculum = z.infer<typeof learnCurriculumSchema>;

export const coverUploadResponseSchema = z.object({ fileId: z.string(), url: z.string() });
export const copyNameResponseSchema = z.object({ name: z.string(), hsk: hskLevelSchema });
export const addItemResponseSchema = z.object({ lesson: lessonSchema, itemId: z.string() });
export const moveItemResponseSchema = z.object({
  lesson: lessonSchema,
  position: z.number(),
  total: z.number(),
});
