import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SUBMISSION_NOTES,
  type Submission,
  reviewRows,
  scorePercent,
  setContentSchema,
  vnDayEnd,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { WORKSPACE_DIRECTORY, type WorkspaceDirectory } from '../../common/directory/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { deadlineOf, isHidden } from '../classes/class-visibility.js';
import { CLASS_MODEL, type ClassDoc } from '../classes/classes.model.js';
import { LESSON_MODEL, type LessonDoc } from '../curriculum/curriculum.model.js';
import { ATTEMPT_MODEL, type AttemptDoc } from './exercises.model.js';

const oid = (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw notFound();
  return new Types.ObjectId(id);
};

/** T14 "Xem bài nộp" of the GV (REQ-20): read-only, A05 for anything not of the caller's workspace. */
@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(ATTEMPT_MODEL) private readonly attempts: Model<AttemptDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @Inject(WORKSPACE_DIRECTORY) private readonly directory: WorkspaceDirectory,
  ) {}

  async submission(
    p: AuthPrincipal,
    q: { classId: string; studentId: string; setId: string },
  ): Promise<Submission> {
    const attempt = await scoped(this.attempts, p.workspaceId)
      .findOne({
        classId: oid(q.classId),
        setId: oid(q.setId),
        studentId: oid(q.studentId),
        status: 'submitted',
      })
      .lean<AttemptDoc>();
    if (!attempt?.submittedAt) throw notFound();
    const [lesson, cls, student] = await Promise.all([
      scoped(this.lessons, p.workspaceId).findById(attempt.lessonId).lean<LessonDoc>(),
      scoped(this.classes, p.workspaceId).findById(attempt.classId).lean<ClassDoc>(),
      this.directory.findUser(q.studentId, p.workspaceId),
    ]);
    const item = lesson?.items.find((i) => String(i._id) === q.setId);
    const content = setContentSchema.safeParse(item?.content);
    if (!lesson || !cls || !item || !content.success) throw notFound();
    // AC-20.6: a hidden section or an archived set does not hide the submission from the GV; the deadline kept by 003
    // still decides "Nộp muộn" (edge case "Hạn nộp — section bị ẩn").
    const deadline = deadlineOf(cls, q.setId);
    const notes = [
      ...(isHidden(cls, lesson._id, 'exercise') ? [SUBMISSION_NOTES.hidden] : []),
      ...(item.status === 'archived' ? [SUBMISSION_NOTES.archived] : []),
    ];
    const score = attempt.score ?? 0;
    const max = attempt.maxScore ?? 0;
    const last = attempt.regrades?.at(-1);
    return {
      student: { id: q.studentId, name: student?.displayName ?? '—' },
      class: { id: String(cls._id), name: cls.name },
      lesson: { id: String(lesson._id), name: lesson.name },
      set: { id: q.setId, title: item.title },
      submittedAt: attempt.submittedAt.toISOString(),
      late: !!deadline && attempt.submittedAt > vnDayEnd(deadline),
      deadline,
      score,
      maxScore: max,
      percent: scorePercent(score, max),
      regrade: last ? { at: last.at.toISOString(), from: last.from, to: last.to } : null,
      notes,
      rows: reviewRows(content.data, attempt.answers ?? {}, attempt.results ?? []),
    };
  }
}
