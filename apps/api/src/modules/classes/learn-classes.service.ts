import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CLASS_ERROR_CODES as E,
  CLASS_MESSAGES as M,
  type ClassItem,
  type Classmate,
  type ClassStatus,
  type LearnerSet,
  type LessonUnit,
  type MyClassCard,
  type MyClassPage,
  NOT_FOUND,
  deadlineLabel,
  learnerSetStatus,
  vnDayEnd,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { NOT_FOUND_MESSAGE } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { CurriculumReader } from '../curriculum/curriculum-reader.js';
import type { ItemDoc, LessonDoc } from '../curriculum/curriculum.model.js';
import { ClassAccess, type ClassView } from './class-access.js';
import { HV_PATHS } from './class-common.js';
import { statusOf, todayOf } from './class-status.js';
import {
  type VisibleUnit,
  classProgress,
  effectiveDeadline,
  questionCount,
  unitProgress,
  visibleUnit,
  visibleUnits,
} from './class-visibility.js';
import { CLASS_MODEL, type ClassDoc, MEMBER_MODEL, type MemberDoc } from './classes.model.js';
import {
  CLASS_EXAMS,
  CLASS_LEARNING,
  type ClassExams,
  type ClassLearning,
  type LearningRecord,
} from './classes.ports.js';
import { MembersService, isActivated } from './members.service.js';

/** A missing or invisible Bài / item of a class the HV is in: A05 with a way back to S02 (AC-17.5). */
const notVisible = (classId: string) =>
  new AppError(404, NOT_FOUND, NOT_FOUND_MESSAGE, { back: HV_PATHS.s02(classId) });

/** S01 order: Đang học (latest start first), Sắp bắt đầu (nearest first), Đã kết thúc (latest end first). */
const RANK: Record<ClassStatus, number> = { active: 0, upcoming: 1, ended: 2 };
const byS01Order = (a: MyClassCard, b: MyClassCard) =>
  RANK[a.status] - RANK[b.status] ||
  (a.status === 'active'
    ? b.startDate.localeCompare(a.startDate)
    : a.status === 'upcoming'
      ? a.startDate.localeCompare(b.startDate)
      : (b.endDate ?? '').localeCompare(a.endDate ?? ''));

/** REQ-12, REQ-13, REQ-19, REQ-20, REQ-23: the HV's classes (S01, S02, S11, members). */
@Injectable()
export class LearnClassesService {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly memberships: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    @Inject(CLASS_EXAMS) private readonly exams: ClassExams,
    private readonly access: ClassAccess,
    private readonly curricula: CurriculumReader,
    private readonly roster: MembersService,
  ) {}

  private async myRecords(p: AuthPrincipal, classId: string): Promise<LearningRecord[]> {
    return this.learning.records(p.workspaceId, classId, { studentIds: [p.userId] });
  }

  private submittedOf(records: readonly LearningRecord[]): Set<string> {
    return new Set(records.filter((r) => r.submission).map((r) => r.setId));
  }

  /** AC-12.1 … AC-12.3 */
  async myClasses(p: AuthPrincipal): Promise<{ items: MyClassCard[] }> {
    const rows = await scoped(this.memberships, p.workspaceId)
      .find({ studentId: new Types.ObjectId(p.userId), removedAt: null })
      .lean<MemberDoc[]>();
    if (!rows.length) return { items: [] };
    const docs = await scoped(this.classes, p.workspaceId)
      .find({ _id: { $in: rows.map((r) => r.classId) } })
      .lean<ClassDoc[]>();
    const today = todayOf(this.clock);
    const curricula = await this.curricula.summaries(
      p.workspaceId,
      docs.map((d) => d.curriculumId),
    );
    const lessonsOf = new Map<string, Promise<LessonDoc[]>>();
    const items = await Promise.all(
      docs.map(async (c): Promise<MyClassCard> => {
        const status = statusOf(c, today);
        const cur = curricula.get(String(c.curriculumId));
        let progress = null;
        if (status !== 'upcoming') {
          const key = String(c.curriculumId);
          if (!lessonsOf.has(key))
            lessonsOf.set(key, this.curricula.lessons(p.workspaceId, c.curriculumId));
          const units = visibleUnits(c, (await lessonsOf.get(key)) ?? []);
          progress = classProgress(
            c,
            units,
            this.submittedOf(await this.myRecords(p, String(c._id))),
          );
        }
        return {
          id: String(c._id),
          name: c.name,
          status,
          startDate: c.startDate,
          endDate: c.endDate ?? null,
          curriculum: { name: cur?.name ?? '', hsk: cur?.hsk ?? 1 },
          progress,
        };
      }),
    );
    return { items: items.sort(byS01Order) };
  }

  /** AC-13.1 … AC-13.8, AC-14.3, AC-20.1 */
  async myClass(p: AuthPrincipal, classId: string): Promise<MyClassPage> {
    const v = await this.access.view(p, classId);
    const c = v.cls;
    const cur = (await this.curricula.summaries(p.workspaceId, [c.curriculumId])).get(
      String(c.curriculumId),
    );
    const base = {
      id: String(c._id),
      name: c.name,
      status: v.status,
      startDate: c.startDate,
      endDate: c.endDate ?? null,
      schedule: c.schedule,
      curriculum: { name: cur?.name ?? '', hsk: cur?.hsk ?? 1 },
    };
    if (v.status === 'upcoming')
      return { ...base, progress: null, lessons: null, memberCount: null, examCount: 0 };
    const [lessons, records, classmates, examCount] = await Promise.all([
      this.access.lessons(p.workspaceId, c),
      this.myRecords(p, classId),
      this.classmates(p, v),
      this.exams.visibleCount(p.workspaceId, classId),
    ]);
    const units = visibleUnits(c, lessons);
    const submitted = this.submittedOf(records);
    return {
      ...base,
      progress: classProgress(c, units, submitted),
      lessons: units.map((u) => ({
        id: String(u.lesson._id),
        name: u.lesson.name,
        sections: [
          ...(u.steps.length ? (['lesson'] as const) : []),
          ...(u.sets.length ? (['exercise'] as const) : []),
        ],
        ...unitProgress(c, u, submitted),
      })),
      memberCount: classmates.length,
      examCount,
    };
  }

  /** AC-20.2 … AC-20.4: activated members only, me first ("Bạn"), then A→Z; name and avatar only. */
  private async classmates(p: AuthPrincipal, v: ClassView): Promise<Classmate[]> {
    const roster = (await this.roster.roster(p.workspaceId, v.cls._id)).filter(
      (r) => isActivated(r.student) || r.student.id === p.userId,
    );
    const me = roster.filter((r) => r.student.id === p.userId);
    const others = roster.filter((r) => r.student.id !== p.userId);
    return [...me, ...others].map((r) => ({
      id: r.student.id,
      displayName: r.student.displayName,
      avatarUrl: null,
      me: r.student.id === p.userId,
    }));
  }

  /** AC-20.1 … AC-20.7 */
  async members(p: AuthPrincipal, classId: string): Promise<{ items: Classmate[] }> {
    const v = await this.access.started(p, classId);
    return { items: await this.classmates(p, v) };
  }

  private learnerSet(
    v: ClassView,
    unit: VisibleUnit | null,
    item: ItemDoc,
    record: LearningRecord | undefined,
  ): LearnerSet {
    const deadline = effectiveDeadline(v.cls, unit, item._id);
    const submitted = !!record?.submission;
    return {
      id: String(item._id),
      title: item.title,
      questionCount: questionCount(item),
      status: learnerSetStatus({
        deadline,
        submitted,
        inProgress: !!record?.inProgress,
        classStatus: v.status,
        now: this.clock.now(),
      }),
      score: record?.submission?.score ?? null,
      maxScore: record?.submission?.maxScore ?? null,
      late: !!record?.submission && !!deadline && record.submission.at > vnDayEnd(deadline),
      deadlineLabel: deadline
        ? deadlineLabel({ deadline, today: v.today, submitted, classStatus: v.status })
        : null,
    };
  }

  /** AC-19.1 … AC-19.9, AC-23.1 … AC-23.6 */
  async lesson(p: AuthPrincipal, classId: string, lessonId: string): Promise<LessonUnit> {
    const v = await this.access.started(p, classId);
    const lesson = (await this.access.lessons(p.workspaceId, v.cls)).find(
      (l) => String(l._id) === lessonId,
    );
    const unit = lesson ? visibleUnit(v.cls, lesson) : null;
    if (!lesson || !unit) throw notVisible(classId);
    const records = await this.myRecords(p, classId);
    const bySet = new Map(records.map((r) => [r.setId, r]));
    return {
      classId,
      className: v.cls.name,
      classStatus: v.status,
      endDate: v.cls.endDate ?? null,
      lesson: { id: lessonId, name: lesson.name },
      ...unitProgress(v.cls, unit, this.submittedOf(records)),
      steps: unit.steps.map((s) => ({ id: String(s._id), title: s.title })),
      sets: unit.sets.map((s) => this.learnerSet(v, unit, s, bySet.get(String(s._id)))),
    };
  }

  /**
   * One step or set for S03 / S05 (004 / 005). A direct link to something not visible is A05 (AC-17.5); the next
   * action on a section that was just hidden (`continue`) is "Nội dung này hiện không khả dụng." (AC-18.1).
   */
  async item(
    p: AuthPrincipal,
    classId: string,
    itemId: string,
    continuing: boolean,
  ): Promise<ClassItem> {
    const found = await this.access.item(p, classId, itemId);
    if (!found) throw notVisible(classId);
    if (!found.visible) {
      if (continuing)
        throw new AppError(409, E.CONTENT_UNAVAILABLE, M.contentUnavailable, {
          back: this.access.backOf(found),
        });
      throw notVisible(classId);
    }
    const { item } = found;
    let set: ClassItem['set'] = null;
    if (item.section === 'exercise') {
      const [record] = await this.learning.records(p.workspaceId, classId, {
        studentIds: [p.userId],
        setIds: [itemId],
      });
      const learner = this.learnerSet(found, found.unit, item, record);
      const blockedReason =
        learner.status === 'done'
          ? null
          : found.status === 'ended'
            ? M.classEndedWork
            : learner.status === 'closed'
              ? M.setClosedWork
              : null;
      set = { ...learner, canWork: !blockedReason && learner.status !== 'done', blockedReason };
    }
    return {
      // A set's content (keys, explanations) never reaches an HV here: 005 serves the learner view (005 AC-16.5).
      item: {
        id: itemId,
        section: item.section,
        title: item.title,
        content: item.section === 'exercise' ? null : item.content,
      },
      lessonId: String(found.lesson._id),
      classStatus: found.status,
      set,
    };
  }
}
