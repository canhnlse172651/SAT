import type { Role } from '@sat/shared';
import { Schema, type Types } from 'mongoose';

export const SESSION_MODEL = 'Session';

/** Why a session ended; kept so the API can answer with the right message (001 AC-5.4 vs AC-12.3). */
export const SESSION_END_REASONS = [
  'logout',
  'expired',
  'password_changed',
  'password_reset',
  'locked',
  'too_many_attempts',
] as const;
export type SessionEndReason = (typeof SESSION_END_REASONS)[number];

export interface SessionRecord {
  tokenHash: string;
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  role: Role;
  userAgent?: string;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  endedAt?: Date;
  endReason?: SessionEndReason;
  /** When MongoDB's TTL monitor may delete the record (ADR-0005: max(idleExpiresAt, endedAt) + 30 days). */
  purgeAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const sessionSchema = new Schema<SessionRecord>(
  {
    tokenHash: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['GV', 'HV'], required: true },
    userAgent: { type: String, maxlength: 512 },
    lastSeenAt: { type: Date, required: true },
    idleExpiresAt: { type: Date, required: true },
    endedAt: { type: Date },
    endReason: { type: String, enum: SESSION_END_REASONS },
    purgeAt: { type: Date, required: true },
  },
  { timestamps: true },
);
sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ workspaceId: 1, userId: 1, endedAt: 1 });
sessionSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
