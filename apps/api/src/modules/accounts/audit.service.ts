import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Schema, Types } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/clock.js';

export const AUDIT_MODEL = 'AuditEvent';
const RETENTION_DAYS = 90;

/** NFR-6: who did what to whom, with which result — never a password, e-mail or name. */
export interface AuditEventDoc {
  at: Date;
  action: string;
  result: 'ok' | 'denied' | 'failed';
  actorId?: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  targetIds?: Types.ObjectId[];
  details?: Record<string, unknown>;
  expiresAt: Date;
}

export const auditEventSchema = new Schema<AuditEventDoc>(
  {
    at: { type: Date, required: true },
    action: { type: String, required: true },
    result: { type: String, enum: ['ok', 'denied', 'failed'], required: true },
    actorId: { type: Schema.Types.ObjectId },
    workspaceId: { type: Schema.Types.ObjectId },
    targetIds: { type: [Schema.Types.ObjectId], default: undefined },
    details: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'audit_events', versionKey: false },
);
auditEventSchema.index({ workspaceId: 1, at: -1 });
auditEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface AuditEntry {
  action: string;
  result?: 'ok' | 'denied' | 'failed';
  actorId?: string | undefined;
  workspaceId?: string | undefined;
  targetIds?: readonly string[];
  /** Ids, counts, reasons only. */
  details?: Record<string, unknown>;
}

const oid = (v: string | undefined) =>
  v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;

/** One-way tag for an e-mail in logs and throttle keys (lets events be correlated without storing the address). */
export const emailTag = (emailKey: string): string =>
  createHash('sha256').update(`sat-email:${emailKey}`).digest('hex').slice(0, 24);

/** Audit trail of module 001 (NFR-6): stored 90 days and mirrored to the structured log. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(
    @InjectModel(AUDIT_MODEL) private readonly model: Model<AuditEventDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    const at = this.clock.now();
    const result = entry.result ?? 'ok';
    this.logger.log({
      msg: 'audit',
      action: entry.action,
      result,
      targets: entry.targetIds?.length ?? 0,
      ...entry.details,
    });
    try {
      await this.model.create({
        at,
        action: entry.action,
        result,
        actorId: oid(entry.actorId),
        workspaceId: oid(entry.workspaceId),
        targetIds: entry.targetIds?.map(oid).filter((v): v is Types.ObjectId => !!v),
        details: entry.details,
        expiresAt: new Date(at.getTime() + RETENTION_DAYS * 86_400_000),
      });
    } catch (err) {
      // Auditing never breaks the user's action; the log line above is still there.
      this.logger.error({ err, action: entry.action }, 'audit write failed');
    }
  }
}
