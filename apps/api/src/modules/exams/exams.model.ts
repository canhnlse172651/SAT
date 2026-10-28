import type { Answers, ExamPhase, GradeResult, Shuffles } from '@sat/shared';
import { Schema, type Types } from 'mongoose';
import {
  baseSchemaOptions,
  versionField,
  workspaceIdField,
  workspaceIndex,
} from '../../common/persistence/base-schema.js';

export const EXAM_MODEL = 'Exam';
export const EXAM_ATTEMPT_MODEL = 'ExamAttempt';
export const EXAM_NOSHOW_MODEL = 'ExamNoShow';

/**
 * A standalone timed exam of a workspace (REQ-2, REQ-3). Đã lên lịch / Đang mở / Đã đóng are derived from `opensAt` /
 * `closesAt` while `phase` is `scheduled` (AC-3.6); `deleted` is never shown again.
 */
export interface ExamDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  /** `foldSearch(name)` for T10 search (AC-1.3). */
  searchKey: string;
  /** 005 set content: `{ instructions, stepId: null, questions }` ("Hướng dẫn" = instructions). */
  content: unknown;
  classIds: Types.ObjectId[];
  opensAt: Date | null;
  durationMin: number | null;
  closesAt: Date | null;
  phase: ExamPhase | 'deleted';
  /** Set by the first "Bắt đầu làm bài" in the same write that reads the content (AC-4.2, AC-4.3, AC-6.2). */
  locked: boolean;
  /** Close processed: every attempt submitted and "Không làm bài" recorded (AC-13.3, AC-14.3). */
  settledAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const examSchema = new Schema<ExamDoc>(
  {
    workspaceId: workspaceIdField,
    name: { type: String, required: true, maxlength: 150 },
    searchKey: { type: String, default: '' },
    content: { type: Schema.Types.Mixed, required: true },
    classIds: { type: [Schema.Types.ObjectId], default: [] },
    opensAt: { type: Date, default: null },
    durationMin: { type: Number, default: null },
    closesAt: { type: Date, default: null },
    phase: {
      type: String,
      enum: ['draft', 'scheduled', 'archived', 'deleted'],
      default: 'draft',
    },
    locked: { type: Boolean, default: false },
    settledAt: { type: Date, default: null },
    version: versionField,
  },
  { ...baseSchemaOptions, collection: 'exams', minimize: false },
);
workspaceIndex(examSchema, { phase: 1, closesAt: 1 });
workspaceIndex(examSchema, { classIds: 1 });

export type ExamAttemptStatus = 'doing' | 'submitted';

/** The one attempt of an HV for an exam (AC-8.3, AC-8.5); once submitted it is the submission (AC-11.2, AC-13.1). */
export interface ExamAttemptDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: ExamAttemptStatus;
  startedAt: Date;
  /** min(start + duration, close) — recomputed when the close time moves later (AC-5.2). */
  endsAt: Date;
  /** Device / tab token that may write (AC-10.4). */
  holder: string;
  shuffles: Shuffles;
  answers: Answers;
  lastIndex: number;
  submittedAt: Date | null;
  /** "Nộp tự động" (AC-12.1). */
  auto: boolean;
  submitKey: string | null;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  results: GradeResult[] | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const examAttemptSchema = new Schema<ExamAttemptDoc>(
  {
    workspaceId: workspaceIdField,
    examId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['doing', 'submitted'], default: 'doing' },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    holder: { type: String, required: true },
    shuffles: { type: Schema.Types.Mixed, default: {} },
    answers: { type: Schema.Types.Mixed, default: {} },
    lastIndex: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
    auto: { type: Boolean, default: false },
    submitKey: { type: String, default: null },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    percent: { type: Number, default: null },
    results: { type: Schema.Types.Mixed, default: null },
    version: versionField,
  },
  { ...baseSchemaOptions, collection: 'exam_attempts', minimize: false },
);
// One attempt per HV × exam, also under concurrent starts (AC-8.5, NFR-3).
workspaceIndex(examAttemptSchema, { examId: 1, studentId: 1 }, { unique: true });
workspaceIndex(examAttemptSchema, { studentId: 1 });
// The settle sweep finds attempts past their end across workspaces.
examAttemptSchema.index({ status: 1, endsAt: 1 });

/** "Không làm bài" of an HV in one assigned class, recorded at close (AC-13.3). */
export interface ExamNoShowDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  examId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const examNoShowSchema = new Schema<ExamNoShowDoc>(
  {
    workspaceId: workspaceIdField,
    examId: { type: Schema.Types.ObjectId, required: true },
    classId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
  },
  { ...baseSchemaOptions, collection: 'exam_noshows' },
);
workspaceIndex(examNoShowSchema, { examId: 1, classId: 1, studentId: 1 }, { unique: true });
workspaceIndex(examNoShowSchema, { classId: 1 });
