import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Role, UNAUTHENTICATED } from '@sat/shared';
import { Model, Types } from 'mongoose';
import { AppError } from '../../errors.js';
import { CLOCK, type Clock } from '../ports/clock.js';
import {
  AUTH_OPTIONS,
  type AuthFailureReason,
  type AuthOptions,
  type AuthPrincipal,
  SESSION_PRINCIPAL_RESOLVER,
  type SessionPrincipalResolver,
} from './auth.types.js';
import { SESSION_MODEL, type SessionEndReason, type SessionRecord } from './session.model.js';

const TOUCH_INTERVAL_MS = 60_000;
const PURGE_GRACE_DAYS = 30;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export interface CreateSessionInput {
  userId: string;
  role: Role;
  workspaceId: string;
  userAgent?: string | undefined;
}

export interface ValidatedSession extends AuthPrincipal {
  /** True when the idle window was extended: the caller should re-send the cookie (new Max-Age). */
  refreshed: boolean;
  maxAgeSeconds: number;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function unauthenticated(reason: AuthFailureReason): AppError {
  return new AppError(401, UNAUTHENTICATED, 'Authentication required', { reason });
}

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(SESSION_MODEL) private readonly sessions: Model<SessionRecord>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
    @Optional()
    @Inject(SESSION_PRINCIPAL_RESOLVER)
    private readonly resolver?: SessionPrincipalResolver,
  ) {}

  ttlMs(role: Role): number {
    return role === 'GV'
      ? this.options.sessionTtlGvHours * HOUR_MS
      : this.options.sessionTtlHvDays * DAY_MS;
  }

  /** Always issues a fresh random id (no fixation). The raw `token` goes into the cookie, only its hash is stored. */
  async create(
    input: CreateSessionInput,
  ): Promise<{ token: string; session: AuthPrincipal & { maxAgeSeconds: number } }> {
    const token = randomBytes(32).toString('base64url');
    const now = this.clock.now();
    const ttl = this.ttlMs(input.role);
    const idleExpiresAt = new Date(now.getTime() + ttl);
    const record = await this.sessions.create({
      tokenHash: hashToken(token),
      userId: new Types.ObjectId(input.userId),
      workspaceId: new Types.ObjectId(input.workspaceId),
      role: input.role,
      ...(input.userAgent ? { userAgent: input.userAgent.slice(0, 512) } : {}),
      lastSeenAt: now,
      idleExpiresAt,
      purgeAt: new Date(idleExpiresAt.getTime() + PURGE_GRACE_DAYS * DAY_MS),
    });
    return {
      token,
      session: {
        sessionId: record.id as string,
        userId: input.userId,
        role: input.role,
        workspaceId: input.workspaceId,
        maxAgeSeconds: ttl / 1000,
      },
    };
  }

  /** Resolves a cookie value to its session, extending the sliding idle window. Throws 401 otherwise. */
  async validate(token: string): Promise<ValidatedSession> {
    const record = await this.sessions.findOne({ tokenHash: hashToken(token) }).lean();
    if (!record) throw unauthenticated('missing');
    if (record.endedAt) throw unauthenticated(record.endReason === 'locked' ? 'locked' : 'expired');

    const now = this.clock.now();
    if (now >= record.idleExpiresAt) {
      await this.end({ _id: record._id }, 'expired');
      throw unauthenticated('expired');
    }

    const principal: AuthPrincipal = {
      sessionId: record._id.toString(),
      userId: record.userId.toString(),
      role: record.role,
      workspaceId: record.workspaceId.toString(),
    };
    const verdict = await this.resolver?.check(principal);
    if (verdict && !verdict.active) {
      const locked = verdict.reason === 'locked';
      await this.end({ _id: record._id }, locked ? 'locked' : 'expired');
      throw unauthenticated(locked ? 'locked' : 'missing');
    }

    const ttl = this.ttlMs(record.role);
    const refreshed = now.getTime() - record.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS;
    if (refreshed) {
      const idleExpiresAt = new Date(now.getTime() + ttl);
      await this.sessions.updateOne(
        { _id: record._id },
        {
          lastSeenAt: now,
          idleExpiresAt,
          purgeAt: new Date(idleExpiresAt.getTime() + PURGE_GRACE_DAYS * DAY_MS),
        },
      );
    }
    return { ...principal, refreshed, maxAgeSeconds: ttl / 1000 };
  }

  /** Ends one session (logout, too many attempts). Idempotent. */
  async revoke(sessionId: string, reason: SessionEndReason = 'logout'): Promise<void> {
    await this.end({ _id: new Types.ObjectId(sessionId) }, reason);
  }

  /** Ends every other session of the user (password change keeps the current one). */
  async revokeAllExcept(
    userId: string,
    keepSessionId: string,
    reason: SessionEndReason = 'password_changed',
  ): Promise<void> {
    await this.end(
      { userId: new Types.ObjectId(userId), _id: { $ne: new Types.ObjectId(keepSessionId) } },
      reason,
    );
  }

  /** Ends every session of the user (lock, password reset). */
  async revokeAll(userId: string, reason: SessionEndReason): Promise<void> {
    await this.end({ userId: new Types.ObjectId(userId) }, reason);
  }

  /** Marks live sessions matching `filter` as ended; purgeAt = max(idleExpiresAt, now) + 30 days. */
  private async end(filter: Record<string, unknown>, reason: SessionEndReason): Promise<void> {
    const now = this.clock.now();
    await this.sessions.updateMany(
      { ...filter, endedAt: { $exists: false } },
      [
        {
          $set: {
            endedAt: now,
            endReason: reason,
            purgeAt: {
              $dateAdd: {
                startDate: { $max: ['$idleExpiresAt', now] },
                unit: 'day',
                amount: PURGE_GRACE_DAYS,
              },
            },
          },
        },
      ],
      { updatePipeline: true },
    );
  }
}
