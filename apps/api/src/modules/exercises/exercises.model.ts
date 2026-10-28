import type { Answers, GradeResult, Shuffles } from '@sat/shared';
import { Schema, type Types } from 'mongoose';
import {
  baseSchemaOptions,
  versionField,
  workspaceIdField,
  workspaceIndex,
} from '../../common/persistence/base-schema.js';

export const ATTEMPT_MODEL = 'ExerciseAttempt';

export type AttemptStatus = 'doing' | 'submitted';

/** A re-grade of the submission after an answer-key change (AC-19.4, AC-19.5). */
export interface RegradeEntry {
  at: Date;
  from: number;
  to: number;
}

/**
 * The one attempt of an HV for a set in a class (AC-14.8): in progress until submitted, then the submission (AC-17.1).
 * Answers, shuffles and results are keyed by question / part ids of the set (AC-18.3).
 */
export interface AttemptDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  classId: Types.ObjectId;
  /** The set: an item of 002's Bài. */
  setId: Types.ObjectId;
  lessonId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt: Date | null;
  /** Client key of the accepted submission: the same key again is the same submission (AC-15.5). */
  submitKey: string | null;
  /** Index of the question last viewed (AC-14.7). */
  lastIndex: number;
  shuffles: Shuffles;
  answers: Answers;
  score: number | null;
  maxScore: number | null;
  results: GradeResult[] | null;
  /** Item version the recorded score was graded against (re-grading sweep, AC-19.6). */
  gradedVersion: number | null;
  regrades: RegradeEntry[];
  /** "Bộ bài tập vừa được giáo viên cập nhật…" is due on the next resume (AC-18.4). */
  notice: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const attemptSchema = new Schema<AttemptDoc>(
  {
    workspaceId: workspaceIdField,
    classId: { type: Schema.Types.ObjectId, required: true },
    setId: { type: Schema.Types.ObjectId, required: true },
    lessonId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['doing', 'submitted'], default: 'doing' },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    submitKey: { type: String, default: null },
    lastIndex: { type: Number, default: 0 },
    shuffles: { type: Schema.Types.Mixed, default: {} },
    answers: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    results: { type: Schema.Types.Mixed, default: null },
    gradedVersion: { type: Number, default: null },
    regrades: {
      type: [{ _id: false, at: Date, from: Number, to: Number }],
      default: [],
    },
    notice: { type: Boolean, default: false },
    version: versionField,
  },
  { ...baseSchemaOptions, collection: 'exercise_attempts', minimize: false },
);
// One attempt per HV × set × class, also under concurrent "Bắt đầu làm" (AC-14.8, NFR-3).
workspaceIndex(attemptSchema, { classId: 1, setId: 1, studentId: 1 }, { unique: true });
workspaceIndex(attemptSchema, { setId: 1, status: 1 });
workspaceIndex(attemptSchema, { studentId: 1, status: 1 });
