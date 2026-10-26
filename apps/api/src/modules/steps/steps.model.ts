import type { CardMark } from '@sat/shared';
import { Schema, type Types } from 'mongoose';
import {
  baseSchemaOptions,
  workspaceIdField,
  workspaceIndex,
} from '../../common/persistence/base-schema.js';

export const LESSON_FILE_MODEL = 'LessonFile';
export const CARD_MARK_MODEL = 'CardMark';
/** Raw collection of 004's lesson media, read by the files module to refuse them to HV (NFR-6). */
export const LESSON_FILES_COLLECTION = 'lesson_files';

/**
 * A file that counts toward the workspace storage (AC-5.5): a block or card file of a step, an AI source document (010)
 * or the dev/test filler. Removed (with the stored bytes) once nothing uses it any more.
 */
export interface LessonFileDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  /** Id in the FileStorage port. */
  fileId: string;
  kind: 'block' | 'card' | 'ai-source' | 'filler';
  size: number;
  name: string;
  contentType: string;
  ownerId: string;
  /** Text of each page (DOCX page / PPTX slide) for the inline viewer (AC-14.5); null for other files. */
  preview: string[][] | null;
  createdAt: Date;
  updatedAt: Date;
}

export const lessonFileSchema = new Schema<LessonFileDoc>(
  {
    workspaceId: workspaceIdField,
    fileId: { type: String, required: true },
    kind: { type: String, enum: ['block', 'card', 'ai-source', 'filler'], required: true },
    size: { type: Number, required: true, min: 0 },
    name: { type: String, required: true, maxlength: 255 },
    contentType: { type: String, required: true },
    ownerId: { type: String, required: true },
    preview: { type: [[String]], default: null },
  },
  { ...baseSchemaOptions, collection: LESSON_FILES_COLLECTION },
);
workspaceIndex(lessonFileSchema, { fileId: 1 }, { unique: true });
workspaceIndex(lessonFileSchema, { kind: 1, createdAt: 1 });

/**
 * A student's own mark of one card (AC-16.5): one per student, step and card (card ids are only unique within a step, and
 * a duplicated Bài keeps them), shared by every class.
 */
export interface CardMarkDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  studentId: Types.ObjectId;
  stepId: Types.ObjectId;
  cardId: string;
  deckId: string;
  mark: CardMark;
  createdAt: Date;
  updatedAt: Date;
}

export const cardMarkSchema = new Schema<CardMarkDoc>(
  {
    workspaceId: workspaceIdField,
    studentId: { type: Schema.Types.ObjectId, required: true },
    stepId: { type: Schema.Types.ObjectId, required: true },
    cardId: { type: String, required: true, maxlength: 40 },
    deckId: { type: String, required: true, maxlength: 40 },
    mark: { type: String, enum: ['known', 'unknown'], required: true },
  },
  { ...baseSchemaOptions, collection: 'card_marks' },
);
workspaceIndex(cardMarkSchema, { studentId: 1, stepId: 1, cardId: 1 }, { unique: true });
workspaceIndex(cardMarkSchema, { stepId: 1 });
