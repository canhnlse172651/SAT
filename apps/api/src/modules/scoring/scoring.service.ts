import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type ClassRanking,
  type ClassStatus,
  type LearnRanking,
  RANKING_MESSAGES as M,
  type RankingClass,
  type ScoreBreakdown,
  type StudentBreakdown,
  rankRows,
  vnDayStart,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { StudentDirectory, type StudentInfo } from '../accounts/student-directory.js';
import { isDuplicateKey } from '../classes/class-common.js';
import { statusOf, todayOf } from '../classes/class-status.js';
import {
  CLASS_MODEL,
  type ClassDoc,
  MEMBER_MODEL,
  type MemberDoc,
} from '../classes/classes.model.js';
import { CLASS_LEARNING, type ClassLearning } from '../classes/classes.ports.js';
import { CurriculumReader } from '../curriculum/curriculum-reader.js';
import { ExamResultsService } from '../exams/exam-results.service.js';
import {
  type ExamSubmission,
  type MemberTimeline,
  type SetSubmission,
  type StudentScore,
  prepareClass,
  scoreStudent,
  studentView,
} from './scoring.engine.js';
import { logScoreChange } from './scoring.log.js';
import { RANK_SCORE_MODEL, type RankScoreDoc } from './scoring.model.js';

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));

/** §7 "HV đã kích hoạt": every account state except "Chưa kích hoạt" and "Gửi email thất bại". */
export const isActivatedForScoring = (s: Pick<StudentInfo, 'status'>): boolean =>
  s.status !== 'pending' && s.status !== 'failed';

/** AC-9.2: not a member, another workspace, missing or malformed — one answer. */
const classNotFound = () => new AppError(404, 'NOT_FOUND', M.notFound);

interface Board {
  now: Date;
  cls: ClassDoc;
  status: ClassStatus;
  members: number;
  rows: {
    student: StudentInfo;
    result: StudentScore;
    rank: number | null;
    /** ISO time the current score was reached (AC-6.6). */
    achievedAt: string | null;
  }[];
}

const STATUS_ORDER: Record<ClassStatus, number> = { active: 0, upcoming: 1, ended: 2 };

/** 008: Điểm xếp hạng, ranks and breakdowns of a class, derived on every read (REQ-1 … REQ-13). */
@Injectable()
export class ScoringService {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @InjectModel(RANK_SCORE_MODEL) private readonly snapshots: Model<RankScoreDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    private readonly curricula: CurriculumReader,
    private readonly examResults: ExamResultsService,
    private readonly students: StudentDirectory,
  ) {}

  /* ---------- HV: S09 ---------- */

  /** AC-8.1: the HV's classes — Đang học (newest start first), Sắp bắt đầu, Đã kết thúc. */
  async learnClasses(p: AuthPrincipal): Promise<{ items: RankingClass[] }> {
    const rows = await scoped(this.members, p.workspaceId)
      .find({ studentId: oid(p.userId), removedAt: null })
      .select({ classId: 1 })
      .lean<Pick<MemberDoc, 'classId'>[]>();
    if (!rows.length) return { items: [] };
    const today = todayOf(this.clock);
    const docs = await scoped(this.classes, p.workspaceId)
      .find({ _id: { $in: rows.map((r) => r.classId) } })
      .lean<ClassDoc[]>();
    const items = docs.map((c) => ({
      id: String(c._id),
      name: c.name,
      status: statusOf(c, today),
      startDate: c.startDate,
    }));
    items.sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.status === 'upcoming'
          ? a.startDate.localeCompare(b.startDate)
          : b.startDate.localeCompare(a.startDate)) ||
        a.name.localeCompare(b.name, 'vi'),
    );
    return { items };
  }

  /** S09 of one class: top 10, my position and my own breakdown only (REQ-7, REQ-9, REQ-11, NFR-7). */
  async learnRanking(p: AuthPrincipal, classId: string): Promise<LearnRanking> {
    if (!Types.ObjectId.isValid(classId)) throw classNotFound();
    const [cls, member] = await Promise.all([
      scoped(this.classes, p.workspaceId).findById(classId).lean<ClassDoc>(),
      scoped(this.members, p.workspaceId)
        .exists({ classId: oid(classId), studentId: oid(p.userId), removedAt: null })
        .exec(),
    ]);
    if (!cls || !member) throw classNotFound();
    const status = statusOf(cls, todayOf(this.clock));
    const ref = { id: classId, name: cls.name, status, startDate: cls.startDate };
    // AC-8.5: nothing to rank before the start day.
    if (status === 'upcoming')
      return {
        class: ref,
        total: 0,
        top: [],
        me: { rank: null, score: 0 },
        mine: emptyBreakdown(),
        loadedAt: this.clock.now().toISOString(),
      };
    const board = await this.board(p.workspaceId, cls);
    const mine = board.rows.find((r) => r.student.id === p.userId);
    return {
      class: ref,
      total: board.rows.length,
      top: board.rows
        .filter((r) => r.rank !== null && r.rank <= 10)
        .slice(0, 10)
        .map((r) => ({
          id: r.student.id,
          name: r.student.displayName,
          rank: r.rank ?? 0,
          score: r.result.breakdown.score,
          me: r.student.id === p.userId,
        })),
      me: { rank: mine?.rank ?? null, score: mine?.result.breakdown.score ?? 0 },
      mine: mine ? studentView(mine.result.breakdown) : emptyBreakdown(),
      loadedAt: board.now.toISOString(),
    };
  }

  /* ---------- GV: T04 tab Xếp hạng ---------- */

  async classRanking(p: AuthPrincipal, classId: string): Promise<ClassRanking> {
    const board = await this.board(p.workspaceId, await this.ownClass(p, classId));
    return {
      class: { id: classId, name: board.cls.name, status: board.status },
      members: board.members,
      rows: board.rows.map((r) => ({
        student: {
          id: r.student.id,
          name: r.student.displayName,
          email: r.student.email,
          locked: r.student.status === 'locked',
        },
        rank: r.rank,
        score: r.result.breakdown.score,
        avgEx: r.result.breakdown.avgEx,
        nEx: r.result.breakdown.nEx,
        avgExam: r.result.breakdown.avgExam,
        nExam: r.result.breakdown.nExam,
        achievedAt: r.achievedAt,
      })),
      loadedAt: board.now.toISOString(),
    };
  }

  /** AC-10.2: the expanded row — every item, hidden / archived / removed ones labelled. */
  async studentBreakdown(
    p: AuthPrincipal,
    classId: string,
    studentId: string,
  ): Promise<StudentBreakdown> {
    const board = await this.board(p.workspaceId, await this.ownClass(p, classId));
    const row = board.rows.find((r) => r.student.id === studentId);
    if (!row) throw notFound();
    return {
      ...row.result.breakdown,
      student: { id: row.student.id, name: row.student.displayName },
    };
  }

  private async ownClass(p: AuthPrincipal, classId: string): Promise<ClassDoc> {
    if (!Types.ObjectId.isValid(classId)) throw classNotFound();
    const cls = await scoped(this.classes, p.workspaceId).findById(classId).lean<ClassDoc>();
    if (!cls) throw classNotFound();
    return cls;
  }

  /* ---------- the board ---------- */

  /** Every activated current member scored and ranked (REQ-1 … REQ-6, AC-10.1). */
  private async board(workspaceId: string, cls: ClassDoc): Promise<Board> {
    const now = this.clock.now();
    const classId = String(cls._id);
    const memberDocs = await scoped(this.members, workspaceId)
      .find({ classId: cls._id, removedAt: null })
      .lean<MemberDoc[]>();
    // AC-5.3: a deleted account is gone from the directory, hence from the board.
    const students = (
      await this.students.byIds(
        workspaceId,
        memberDocs.map((m) => String(m.studentId)),
      )
    ).filter(isActivatedForScoring);
    const ids = students.map((s) => s.id);
    const [activatedAt, lessons, records, exams, snapshots] = await Promise.all([
      this.students.activatedAt(workspaceId, ids),
      this.curricula.lessons(workspaceId, cls.curriculumId),
      ids.length ? this.learning.records(workspaceId, classId, { studentIds: ids }) : [],
      this.examResults.scoringData(workspaceId, classId),
      scoped(this.snapshots, workspaceId).find({ classId: cls._id }).lean<RankScoreDoc[]>(),
    ]);

    const memberOf = new Map(memberDocs.map((m) => [String(m.studentId), m]));
    const setsOf = groupBy(
      records.flatMap((r) =>
        r.submission
          ? [
              {
                key: r.studentId,
                id: r.setId,
                value: {
                  score: r.submission.score,
                  maxScore: r.submission.maxScore,
                  at: r.submission.at,
                  regrades: r.submission.regrades ?? [],
                } satisfies SetSubmission,
              },
            ]
          : [],
      ),
    );
    const examsOf = groupBy(
      exams.submissions.map((s) => ({
        key: s.studentId,
        id: s.examId,
        value: { score: s.score, maxScore: s.maxScore, at: s.submittedAt } satisfies ExamSubmission,
      })),
    );
    const noShowsOf = new Map<string, Set<string>>();
    for (const n of exams.noShows) {
      const set = noShowsOf.get(n.studentId) ?? new Set<string>();
      set.add(n.examId);
      noShowsOf.set(n.studentId, set);
    }

    const inputs = prepareClass({ now, cls, lessons, exams: exams.exams });
    const scored = students.map((student) => {
      const member = memberOf.get(student.id);
      return {
        student,
        result: scoreStudent(inputs, {
          member: timeline(member, activatedAt.get(student.id)),
          sets: setsOf.get(student.id) ?? new Map(),
          exams: examsOf.get(student.id) ?? new Map(),
          noShows: noShowsOf.get(student.id) ?? new Set(),
        }),
      };
    });
    const achieved = await this.track(workspaceId, cls._id, scored, snapshots, now);
    const rows = rankRows(
      scored.map((s) => ({
        ...s,
        achievedAt: achieved.get(s.student.id) ?? null,
        name: s.student.displayName,
        email: s.student.email,
        score: s.result.breakdown.score,
      })),
    );
    return {
      now,
      cls,
      status: statusOf(cls, todayOf(this.clock)),
      members: memberDocs.length,
      rows,
    };
  }

  /**
   * AC-6.6, NFR-8: the time the current score was reached is the replayed last change (`changed`), also when the score went
   * away and back between two reads. When the replay cannot explain a change seen against the last stored score (an
   * unhide, an archive, a membership change), it takes the newest input event newer than the stored time, otherwise now.
   * Changes against the stored score are logged.
   */
  private async track(
    workspaceId: string,
    classId: Types.ObjectId,
    scored: { student: StudentInfo; result: StudentScore }[],
    snapshots: RankScoreDoc[],
    now: Date,
  ): Promise<Map<string, string | null>> {
    const prevOf = new Map(snapshots.map((s) => [String(s.studentId), s]));
    const out = new Map<string, string | null>();
    const writes: Promise<unknown>[] = [];
    const scope = scoped(this.snapshots, workspaceId);
    for (const { student, result } of scored) {
      const { score, avgEx, avgExam } = result.breakdown;
      const prev = prevOf.get(student.id);
      // The newest input event explains the change only when it happened after the time already recorded.
      const event =
        result.lastEvent && (!prev?.achievedAt || result.lastEvent.at > prev.achievedAt)
          ? result.lastEvent
          : null;
      // The replay counts only when it lands after the time already recorded.
      const replayed =
        result.changed && (!prev?.achievedAt || result.changed.at > prev.achievedAt)
          ? result.changed
          : null;
      let achievedAt = replayed?.at ?? prev?.achievedAt ?? null;
      const changed = !prev || prev.score !== score;
      if (changed) {
        const cause = replayed ?? event;
        achievedAt = score > 0 || prev ? (cause?.at ?? now) : null;
        if (prev || score > 0)
          logScoreChange({
            classId: String(classId),
            studentId: student.id,
            itemId: cause?.itemId ?? null,
            reason: cause?.reason ?? 'Thay đổi nội dung',
            before: prev ? { avgEx: prev.avgEx, avgExam: prev.avgExam, score: prev.score } : null,
            after: { avgEx, avgExam, score },
            at: (achievedAt ?? now).toISOString(),
          });
      }
      out.set(student.id, achievedAt?.toISOString() ?? null);
      const values = { score, avgEx, avgExam, achievedAt };
      if (!prev)
        writes.push(
          scope.create({ classId, studentId: oid(student.id), ...values }).catch((err: unknown) => {
            // Two readers recording the same first sighting: the other write won, same values.
            if (!isDuplicateKey(err)) throw err;
          }),
        );
      else if (
        changed ||
        prev.avgEx !== avgEx ||
        prev.avgExam !== avgExam ||
        achievedAt?.getTime() !== prev.achievedAt?.getTime()
      )
        writes.push(scope.updateOne({ _id: prev._id }, { $set: values }).exec());
    }
    await Promise.all(writes);
    return out;
  }
}

function groupBy<V>(rows: { key: string; id: string; value: V }[]): Map<string, Map<string, V>> {
  const out = new Map<string, Map<string, V>>();
  for (const r of rows) {
    const inner = out.get(r.key) ?? new Map<string, V>();
    inner.set(r.id, r.value);
    out.set(r.key, inner);
  }
  return out;
}

/** Membership periods (current + history; rows from before 008 start at their VN join day) and activation. */
function timeline(member: MemberDoc | undefined, activatedAt: Date | undefined): MemberTimeline {
  if (!member) return { periods: [], activeSince: null };
  return {
    periods: [
      ...(member.history ?? []).map((h) => ({ from: h.from, to: h.to })),
      { from: member.addedAt ?? vnDayStart(member.joinedAt), to: null },
    ],
    // §7: the caller already filtered to activated accounts; one activated before this was recorded counts from always.
    activeSince: activatedAt ?? new Date(0),
  };
}

const emptyBreakdown = (): ScoreBreakdown => ({
  score: 0,
  avgEx: 0,
  nEx: 0,
  avgExam: 0,
  nExam: 0,
  submitted: 0,
  withDeadline: 0,
  sets: [],
  exams: [],
  hidden: null,
  gone: null,
});
