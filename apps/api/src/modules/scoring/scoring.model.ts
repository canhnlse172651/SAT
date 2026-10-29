import { Schema, type Types } from 'mongoose';
import {
  baseSchemaOptions,
  workspaceIdField,
  workspaceIndex,
} from '../../common/persistence/base-schema.js';

export const RANK_SCORE_MODEL = 'RankScore';

/**
 * The last Điểm xếp hạng seen for one HV in one class. Scores are derived on every read; this row only keeps when the
 * displayed score last changed (AC-6.6, the tie order of AC-6.2, "Cập nhật lần cuối") and the before-values of the
 * change log (NFR-8).
 */
export interface RankScoreDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  score: number;
  avgEx: number;
  avgExam: number;
  achievedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const rankScoreSchema = new Schema<RankScoreDoc>(
  {
    workspaceId: workspaceIdField,
    classId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    avgEx: { type: Number, required: true },
    avgExam: { type: Number, required: true },
    achievedAt: { type: Date, default: null },
  },
  { ...baseSchemaOptions, collection: 'rank_scores' },
);
workspaceIndex(rankScoreSchema, { classId: 1, studentId: 1 }, { unique: true });
