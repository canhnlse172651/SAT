import type { HskLevel, ItemStatus, LessonStatus, Section } from '@sat/shared';
import { Schema, type Types } from 'mongoose';
import {
  baseSchemaOptions,
  versionField,
  workspaceIdField,
  workspaceIndex,
} from '../../common/persistence/base-schema.js';

export const CURRICULUM_MODEL = 'Curriculum';
export const LESSON_MODEL = 'Lesson';

export interface CurriculumDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  /** `foldSearch(name)`: unique per workspace, archived ones included (AC-1.4). */
  nameKey: string;
  hsk: HskLevel;
  description: string;
  coverFileId?: Types.ObjectId | null;
  archivedAt?: Date | null;
  /** The Bài order (REQ-6): one atomic array instead of a position per lesson. */
  lessonIds: Types.ObjectId[];
  /** Set while a duplicate is being written; such a copy is invisible and swept when stale (AC-15.5). */
  copyState?: 'copying' | null;
  /** A duplicate of this curriculum is running (AC-15.6). */
  copyLockAt?: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const curriculumSchema = new Schema<CurriculumDoc>(
  {
    workspaceId: workspaceIdField,
    name: { type: String, required: true, maxlength: 100 },
    nameKey: { type: String, required: true },
    hsk: { type: Number, required: true, min: 1, max: 9 },
    description: { type: String, default: '', maxlength: 2000 },
    coverFileId: { type: Schema.Types.ObjectId, default: null },
    archivedAt: { type: Date, default: null },
    lessonIds: { type: [Schema.Types.ObjectId], default: [] },
    copyState: { type: String, enum: ['copying', null], default: null },
    copyLockAt: { type: Date, default: null },
    version: versionField,
  },
  { ...baseSchemaOptions, collection: 'curricula' },
);
workspaceIndex(curriculumSchema, { nameKey: 1 }, { unique: true });
workspaceIndex(curriculumSchema, { archivedAt: 1, updatedAt: -1 });

/** A step (section `lesson`) or an exercise set (section `exercise`) inside a Bài. */
export interface ItemDoc {
  _id: Types.ObjectId;
  section: Section;
  title: string;
  status: ItemStatus;
  /** "AI tạo" (AC-11.5, AC-11.7). */
  ai: boolean;
  /** Owned by 004 / 005 (interim shape in @sat/shared). */
  content: unknown;
  version: number;
  updatedAt: Date;
}

export interface LessonDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  curriculumId: Types.ObjectId;
  name: string;
  status: LessonStatus;
  /**
   * Both sections in one array: a section's order is the array order filtered by `section` (AC-8.1), so
   * publishing, ordering and replacing a section are single-document (atomic) updates.
   */
  items: ItemDoc[];
  /** Last change of each section's items (T18 summary, AC-7.3). */
  sectionUpdatedAt: { lesson: Date | null; exercise: Date | null };
  /** A duplicate of this Bài is running (AC-15.6). */
  copyLockAt?: Date | null;
  /** Name and status only; items carry their own version. */
  version: number;
  /** Bumped on every write of `items`: the compare-and-swap guard of read-modify-write updates. */
  rev: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ItemDoc>(
  {
    section: { type: String, enum: ['lesson', 'exercise'], required: true, immutable: true },
    title: { type: String, default: '', maxlength: 200 },
    status: { type: String, enum: ['draft', 'published', 'archived'], required: true },
    ai: { type: Boolean, default: false },
    content: { type: Schema.Types.Mixed, required: true },
    version: { type: Number, required: true, default: 1 },
    updatedAt: { type: Date, required: true },
  },
  { _id: true, versionKey: false, minimize: false },
);

export const lessonSchema = new Schema<LessonDoc>(
  {
    workspaceId: workspaceIdField,
    curriculumId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    name: { type: String, required: true, maxlength: 100 },
    status: { type: String, enum: ['draft', 'published'], required: true },
    items: { type: [itemSchema], default: [] },
    sectionUpdatedAt: {
      lesson: { type: Date, default: null },
      exercise: { type: Date, default: null },
    },
    copyLockAt: { type: Date, default: null },
    version: versionField,
    rev: { type: Number, required: true, default: 1 },
  },
  { ...baseSchemaOptions, collection: 'lessons', minimize: false },
);
workspaceIndex(lessonSchema, { curriculumId: 1 });
workspaceIndex(lessonSchema, { 'items._id': 1 });
