import type { Section } from '@sat/shared';
import { Schema, type Types } from 'mongoose';
import {
  baseSchemaOptions,
  versionField,
  workspaceIdField,
  workspaceIndex,
} from '../../common/persistence/base-schema.js';

export const CLASS_MODEL = 'Class';
export const MEMBER_MODEL = 'ClassMember';
export const REMINDER_MODEL = 'DeadlineReminder';
export const REMINDER_RUN_MODEL = 'ReminderRun';

/** "Đang ẩn" of one section of one Bài in one class (REQ-16); absent = "Hiển thị". */
export interface HiddenSection {
  lessonId: Types.ObjectId;
  section: Section;
  by: Types.ObjectId;
  at: Date;
}

/** One deadline of one set in one class (REQ-21): the VN day, 23:59 of it. */
export interface Deadline {
  setId: Types.ObjectId;
  date: string;
  by: Types.ObjectId;
  at: Date;
  /** Last completed 08:00 sweep for this deadline (AC-26.3); dropped when the deadline changes. */
  reminded?: { date: string; at: Date; count: number } | null;
}

export interface ClassDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  /** Trimmed, lower-case: unique per workspace, ended classes included (AC-2.4). */
  nameKey: string;
  /** `foldSearch(name)` for T02 search (AC-6.2). */
  searchKey: string;
  description: string;
  schedule: string;
  /** VN day 'YYYY-MM-DD'; the status is derived from it (AC-14.1). */
  startDate: string;
  /** VN day the GV ended the class; null while not ended (AC-10.6). */
  endDate: string | null;
  curriculumId: Types.ObjectId;
  /** Active memberships; changed only by guarded `$inc` so it never exceeds 100 (AC-8.4). */
  memberCount: number;
  hidden: HiddenSection[];
  deadlines: Deadline[];
  /** One per wizard run (AC-5.6). */
  createKey: string;
  /** Class info (T04 "Sửa thông tin lớp", AC-7.5). */
  version: number;
  /** Bumped on writes of `hidden` / `deadlines`: the compare-and-swap guard of those all-or-nothing updates. */
  rev: number;
  createdAt: Date;
  updatedAt: Date;
}

const hiddenSchema = new Schema<HiddenSection>(
  {
    lessonId: { type: Schema.Types.ObjectId, required: true },
    section: { type: String, enum: ['lesson', 'exercise'], required: true },
    by: { type: Schema.Types.ObjectId, required: true },
    at: { type: Date, required: true },
  },
  { _id: false },
);

const deadlineSchema = new Schema<Deadline>(
  {
    setId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    by: { type: Schema.Types.ObjectId, required: true },
    at: { type: Date, required: true },
    reminded: {
      type: new Schema(
        { date: String, at: Date, count: Number },
        { _id: false, versionKey: false },
      ),
      default: null,
    },
  },
  { _id: false },
);

export const classSchema = new Schema<ClassDoc>(
  {
    workspaceId: workspaceIdField,
    name: { type: String, required: true, maxlength: 100 },
    nameKey: { type: String, required: true },
    searchKey: { type: String, required: true },
    description: { type: String, default: '', maxlength: 500 },
    schedule: { type: String, default: '', maxlength: 200 },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    curriculumId: { type: Schema.Types.ObjectId, required: true },
    memberCount: { type: Number, required: true, default: 0, min: 0, max: 100 },
    hidden: { type: [hiddenSchema], default: [] },
    deadlines: { type: [deadlineSchema], default: [] },
    createKey: { type: String, required: true },
    version: versionField,
    rev: { type: Number, required: true, default: 1 },
  },
  { ...baseSchemaOptions, collection: 'classes', minimize: false },
);
workspaceIndex(classSchema, { nameKey: 1 }, { unique: true });
workspaceIndex(classSchema, { createKey: 1 }, { unique: true });
workspaceIndex(classSchema, { curriculumId: 1 });
workspaceIndex(classSchema, { startDate: -1, _id: -1 });
// The 08:00 sweep looks up the deadlines of one day across workspaces.
classSchema.index({ 'deadlines.date': 1 });

export interface MemberDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  /** VN day of the (last) addition (AC-5.3, AC-8.3). */
  joinedAt: string;
  /** Set on removal; the row is kept so a re-added HV gets their data back (AC-8.6). */
  removedAt: Date | null;
  /** Clock time of the (last) addition; absent on rows written before 008 (fall back to `joinedAt`). */
  addedAt?: Date;
  /** Earlier membership periods, pushed on removal: 008 counts a missed deadline only inside a period (AC-5.2). */
  history: { from: Date; to: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export const memberSchema = new Schema<MemberDoc>(
  {
    workspaceId: workspaceIdField,
    classId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    joinedAt: { type: String, required: true },
    removedAt: { type: Date, default: null },
    addedAt: { type: Date },
    history: { type: [{ _id: false, from: Date, to: Date }], default: [] },
  },
  { ...baseSchemaOptions, collection: 'class_members' },
);
workspaceIndex(memberSchema, { classId: 1, studentId: 1 }, { unique: true });
workspaceIndex(memberSchema, { studentId: 1, removedAt: 1 });

/** One reminder e-mail: at most one per student, class and day (AC-24.5). */
export interface ReminderDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  date: string;
  setIds: Types.ObjectId[];
  result: 'pending' | 'sent' | 'failed';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const reminderSchema = new Schema<ReminderDoc>(
  {
    workspaceId: workspaceIdField,
    classId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    setIds: { type: [Schema.Types.ObjectId], default: [] },
    result: { type: String, enum: ['pending', 'sent', 'failed'], required: true },
    reason: { type: String },
  },
  { ...baseSchemaOptions, collection: 'deadline_reminders' },
);
workspaceIndex(reminderSchema, { studentId: 1, classId: 1, date: 1 }, { unique: true });

/** One 08:00 sweep per VN day (system-wide, not a workspace document). */
export interface ReminderRunDoc {
  _id: string;
  status: 'running' | 'finished';
  startedAt: Date;
  finishedAt: Date | null;
  sent: number;
  failed: number;
}

export const reminderRunSchema = new Schema<ReminderRunDoc>(
  {
    _id: { type: String, required: true },
    status: { type: String, enum: ['running', 'finished'], required: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { versionKey: false, collection: 'reminder_runs' },
);
