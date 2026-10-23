import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Schema } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/clock.js';

export const THROTTLE_MODEL = 'Throttle';

/** A counter in a fixed window that starts at its first hit, optionally blocked until a time (not workspace data). */
export interface ThrottleDoc {
  key: string;
  count: number;
  windowStart: Date;
  blockedUntil?: Date;
  /** TTL: removed once neither the window nor the block matters any more. */
  expiresAt: Date;
}

export const throttleSchema = new Schema<ThrottleDoc>(
  {
    key: { type: String, required: true },
    count: { type: Number, required: true },
    windowStart: { type: Date, required: true },
    blockedUntil: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'throttles', versionKey: false },
);
throttleSchema.index({ key: 1 }, { unique: true });
throttleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MINUTE = 60_000;

/** Window and block lengths of spec 001 (REQ-4, AC-15.3, NFR-5). */
export const THROTTLES = {
  /** AC-4.1: 5 wrong passwords for one e-mail within 15 min → 15 min lock. */
  loginEmail: { limit: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  /** NFR-5: 50 wrong passwords from one address per 15 min. */
  loginIp: { limit: 50, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  /** NFR-5: 10 sign-ups from one address per hour. */
  registerIp: { limit: 10, windowMs: 60 * MINUTE, blockMs: 15 * MINUTE },
  /** AC-15.3: 5 wrong current passwords in one session (no time window). */
  currentPassword: { limit: 5, windowMs: 400 * 24 * 60 * MINUTE, blockMs: 0 },
} as const;
export type ThrottleRule = (typeof THROTTLES)[keyof typeof THROTTLES];

/**
 * MongoDB-backed counters, so limits hold across API instances. Keys holding an e-mail are hashed by
 * callers (`throttleKey`) so no address is stored; documents expire with their window or block.
 */
@Injectable()
export class ThrottleService {
  constructor(
    @InjectModel(THROTTLE_MODEL) private readonly model: Model<ThrottleDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** When the key is blocked until (in the future), else null. */
  async blockedUntil(key: string): Promise<Date | null> {
    const doc = await this.model.findOne({ key }).select({ blockedUntil: 1 }).lean();
    const now = this.clock.now();
    return doc?.blockedUntil && doc.blockedUntil > now ? doc.blockedUntil : null;
  }

  /**
   * Counts one more hit; a window that has run out, or a block that is over, starts again at 1
   * (AC-4.4: the counter returns to 0 when the lock ends). Blocks once the count reaches `limit`.
   * Returns the new count and whether the key is now blocked.
   */
  async hit(key: string, rule: ThrottleRule): Promise<{ count: number; blocked: boolean }> {
    const now = this.clock.now();
    const doc = await this.model.findOne({ key }).lean();
    const expired =
      !doc ||
      doc.windowStart.getTime() + rule.windowMs <= now.getTime() ||
      (doc.blockedUntil !== undefined && doc.blockedUntil <= now);
    const count = expired ? 1 : doc.count + 1;
    const windowStart = expired ? now : doc.windowStart;
    const blocked = rule.blockMs > 0 && count >= rule.limit;
    const blockedUntil = blocked ? new Date(now.getTime() + rule.blockMs) : undefined;
    const expiresAt = new Date(
      Math.max(windowStart.getTime() + rule.windowMs, blockedUntil?.getTime() ?? 0),
    );
    await this.model.updateOne(
      { key },
      {
        $set: { count, windowStart, expiresAt, ...(blockedUntil ? { blockedUntil } : {}) },
        ...(blockedUntil ? {} : { $unset: { blockedUntil: 1 } }),
      },
      { upsert: true },
    );
    return { count, blocked };
  }

  /** Forgets the key (successful sign-in, new password — AC-4.4). */
  async reset(key: string): Promise<void> {
    await this.model.deleteOne({ key });
  }
}
