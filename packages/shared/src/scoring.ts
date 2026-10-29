import { z } from 'zod';
import { formatDay } from './classes.js';
import { classStatusSchema } from './curriculum.js';
import { scorePercent } from './exercises.js';
import { formatNumber, formatScore, roundHalfUp } from './numbers.js';

/* ---------- 008 Điểm & Xếp hạng: arithmetic (REQ-1), ranks (REQ-6), texts and API contracts ---------- */

/** AC-1.2: an item's points on 0–100 = (got ÷ max) × 100, rounded half-up to an integer. */
export const itemPoints = (got: number, max: number): number => scorePercent(got, max);

/** AC-1.10: one decimal, 0,05 upwards. */
export const roundOne = (value: number): number => roundHalfUp(value, 1);

/** AC-1.6, AC-1.7: the mean of the counted items' points, rounded; 0 without any. */
export const average = (points: readonly number[]): number =>
  points.length ? roundOne(points.reduce((a, b) => a + b, 0) / points.length) : 0;

export const EXERCISE_WEIGHT = 0.3;
export const EXAM_WEIGHT = 0.7;

/** AC-1.1, AC-1.10: Điểm xếp hạng from the two already rounded averages. */
export const rankingScore = (avgEx: number, avgExam: number): number =>
  roundOne(EXERCISE_WEIGHT * avgEx + EXAM_WEIGHT * avgExam);

/** AC-13.5: "30% × 71,1 + 70% × 78,0 = 75,9". */
export const formulaText = (avgEx: number, avgExam: number, score: number): string =>
  `30% × ${formatScore(avgEx)} + 70% × ${formatScore(avgExam)} = ${formatScore(score)}`;

/** AC-6.2: the given name is the last word of the full name. */
export const givenName = (name: string): string => name.trim().split(/\s+/).pop() ?? '';

const collator = new Intl.Collator('vi', { sensitivity: 'variant' });

export interface RankInput {
  name: string;
  email: string;
  score: number;
  /** ISO time the current score was reached (AC-6.6). */
  achievedAt: string | null;
}

/** AC-6.2 / AC-6.3: order inside a tie (and among the unranked). */
function tieOrder(a: RankInput, b: RankInput): number {
  const at = (r: RankInput) => (r.achievedAt ? Date.parse(r.achievedAt) : Infinity);
  return (
    (a.score > 0 ? at(a) - at(b) : 0) ||
    collator.compare(givenName(a.name), givenName(b.name)) ||
    collator.compare(a.name, b.name) ||
    collator.compare(a.email, b.email)
  );
}

/**
 * REQ-6: rows with a score > 0 by score, ties sharing a rank (1, 2, 2, 4) and ordered by time reached, given name, full
 * name, e-mail; rows at 0,0 are unranked (`rank: null`) and follow by name.
 */
export function rankRows<T extends RankInput>(rows: readonly T[]): (T & { rank: number | null })[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score || tieOrder(a, b));
  let rank = 0;
  return sorted.map((r, i) => {
    if (r.score <= 0) return { ...r, rank: null };
    if (i === 0 || sorted[i - 1]?.score !== r.score) rank = i + 1;
    return { ...r, rank };
  });
}

export const RANKING_MESSAGES = {
  notFound: 'Không tìm thấy lớp.',
  noClass:
    'Bạn chưa thuộc lớp nào. Khi giáo viên thêm bạn vào lớp, bảng xếp hạng sẽ hiển thị tại đây.',
  upcoming: (startDate: string) =>
    `Lớp bắt đầu ngày ${formatDay(startDate)}. Bảng xếp hạng sẽ có khi lớp bắt đầu.`,
  ended: 'Lớp đã kết thúc · Xếp hạng cuối cùng',
  nobodyYet: 'Chưa có học viên nào có điểm. Hãy làm bài tập để ghi điểm đầu tiên!',
  unranked: 'Bạn chưa có hạng. Hoàn thành bài tập để nhận điểm xếp hạng.',
  noRank: 'Chưa có hạng',
  position: (rank: number, total: number) => `Hạng ${rank}/${total}`,
  noSets: 'Lớp chưa có bài tập nào để tính điểm.',
  noExams: 'Lớp chưa có bài thi nào.',
  hiddenLine: (k: number, sum: number) =>
    `Nội dung đã ẩn: ${k} bộ bài tập · ${formatNumber(sum)} điểm`,
  goneLine: (k: number, sum: number) => `Bài thi đã gỡ: ${k} bài thi · ${formatNumber(sum)} điểm`,
  loadError: 'Không tải được bảng xếp hạng. Vui lòng thử lại.',
  noStudents: 'Lớp chưa có học viên. Thêm học viên ở tab Học viên.',
  noMatch: (q: string) => `Không có học viên nào khớp với “${q}”.`,
  notCounted: 'Không tính',
} as const;

/* ---------- API contracts ---------- */

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const iso = z.string();
const count = z.number().int().min(0);

export const rankingClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: classStatusSchema,
  startDate: day,
});
export type RankingClass = z.infer<typeof rankingClassSchema>;

/** Bộ bài tập: Chưa làm / Đã có điểm / Quá hạn; Bài thi: Chưa thi / Đã có điểm / Không làm bài (AC-11.1, AC-11.8). */
export const setScoreStatusSchema = z.enum(['todo', 'done', 'overdue']);
export const examScoreStatusSchema = z.enum(['todo', 'done', 'noShow']);

export const setScoreRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  lessonId: z.string(),
  lessonName: z.string(),
  status: setScoreStatusSchema,
  late: z.boolean(),
  deadline: day.nullable(),
  got: z.number().nullable(),
  max: z.number().nullable(),
  /** 0–100 of the item when it has points (submission or 0 when overdue). */
  points: z.number().nullable(),
  counted: z.boolean(),
  /** GV only: "Đã ẩn trong lớp" / "Đã lưu trữ" (AC-10.2). */
  flag: z.enum(['hidden', 'archived']).nullable(),
});
export type SetScoreRow = z.infer<typeof setScoreRowSchema>;

export const examScoreRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  opensAt: iso.nullable(),
  closesAt: iso.nullable(),
  status: examScoreStatusSchema,
  got: z.number().nullable(),
  max: z.number().nullable(),
  points: z.number().nullable(),
  counted: z.boolean(),
  /** GV only: "Đã gỡ khỏi lớp" (AC-10.2). */
  flag: z.enum(['removed']).nullable(),
});
export type ExamScoreRow = z.infer<typeof examScoreRowSchema>;

const aggregateLine = z.object({ k: count, sum: z.number() }).nullable();

/** Chi tiết điểm of one HV in one class (REQ-11; the GV's variant lists flagged rows instead of the two lines). */
export const scoreBreakdownSchema = z.object({
  score: z.number(),
  avgEx: z.number(),
  nEx: count,
  avgExam: z.number(),
  nExam: count,
  /** "Bộ bài tập đã nộp x/y" (AC-11.2). */
  submitted: count,
  withDeadline: count,
  sets: z.array(setScoreRowSchema),
  exams: z.array(examScoreRowSchema),
  hidden: aggregateLine,
  gone: aggregateLine,
});
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

/** GET /api/learn/ranking/classes — S09 class picker (AC-8.1). */
export const learnRankingClassesSchema = z.object({ items: z.array(rankingClassSchema) });

/** One classmate on S09: nothing but name, rank and score (AC-9.1, NFR-7). */
export const rankingTopRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  rank: z.number().int(),
  score: z.number(),
  me: z.boolean(),
});
export type RankingTopRow = z.infer<typeof rankingTopRowSchema>;

/** GET /api/learn/ranking/:classId — S09 (REQ-7, REQ-11, REQ-13). */
export const learnRankingSchema = z.object({
  class: rankingClassSchema,
  /** N of "Hạng r/N": activated current members (AC-7.2). */
  total: count,
  top: z.array(rankingTopRowSchema),
  me: z.object({ rank: z.number().int().nullable(), score: z.number() }),
  mine: scoreBreakdownSchema,
  loadedAt: iso,
});
export type LearnRanking = z.infer<typeof learnRankingSchema>;

export const classRankingRowSchema = z.object({
  student: z.object({ id: z.string(), name: z.string(), email: z.string(), locked: z.boolean() }),
  rank: z.number().int().nullable(),
  score: z.number(),
  avgEx: z.number(),
  nEx: count,
  avgExam: z.number(),
  nExam: count,
  achievedAt: iso.nullable(),
});
export type ClassRankingRow = z.infer<typeof classRankingRowSchema>;

/** GET /api/classes/:classId/ranking — T04 tab Xếp hạng (REQ-10). */
export const classRankingSchema = z.object({
  class: z.object({ id: z.string(), name: z.string(), status: classStatusSchema }),
  /** Current members in any account state (AC-10.5 "Lớp chưa có học viên"). */
  members: count,
  rows: z.array(classRankingRowSchema),
  loadedAt: iso,
});
export type ClassRanking = z.infer<typeof classRankingSchema>;

/** GET /api/classes/:classId/ranking/:studentId — the expanded row (AC-10.2). */
export const studentBreakdownSchema = scoreBreakdownSchema.extend({
  student: z.object({ id: z.string(), name: z.string() }),
});
export type StudentBreakdown = z.infer<typeof studentBreakdownSchema>;
