import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ACCOUNT_ERROR_CODES as E, ACCOUNT_MESSAGES as M, MAIL_TAGS } from '@sat/shared';
import { type Model, Schema, type Types } from 'mongoose';
import { hashPassword } from '../../common/auth/password.js';
import { SessionService } from '../../common/auth/session.service.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { EMAIL_SENDER, type EmailSender } from '../../common/ports/email.js';
import { AppError } from '../../errors.js';
import { MAIL_FROM_NAME, renderMail, teacherResetMail } from './account-mail.templates.js';
import { ACCOUNTS_OPTIONS, type AccountsOptions } from './accounts.options.js';
import { USER_MODEL, type UserDoc } from './accounts.model.js';
import { AuditService } from './audit.service.js';
import { loginEmailKey } from './auth.service.js';
import { ThrottleService } from './throttle.service.js';

export const PASSWORD_RESET_MODEL = 'PasswordReset';
const LINK_TTL_MS = 60 * 60_000;
const MAILS_PER_HOUR = 3;

/** A reset link sent to a GV (only the token's SHA-256 is stored — NFR-4). */
export interface PasswordResetDoc {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  supersededAt?: Date;
  createdAt: Date;
  /** TTL: kept a day after expiry, then removed. */
  purgeAt: Date;
}

export const passwordResetSchema = new Schema<PasswordResetDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    supersededAt: { type: Date },
    createdAt: { type: Date, required: true },
    purgeAt: { type: Date, required: true },
  },
  { collection: 'password_resets', versionKey: false },
);
passwordResetSchema.index({ tokenHash: 1 }, { unique: true });
passwordResetSchema.index({ userId: 1, createdAt: -1 });
passwordResetSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

const sha256 = (token: string) => createHash('sha256').update(token).digest('hex');
const invalidLink = () => new AppError(400, E.INVALID_RESET_LINK, M.resetLinkInvalid);

/** REQ-6: GV forgot / reset password. Answers never reveal whether an e-mail has an account (AC-6.1, AC-6.3). */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger('PasswordReset');

  constructor(
    @InjectModel(PASSWORD_RESET_MODEL) private readonly resets: Model<PasswordResetDoc>,
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @Inject(EMAIL_SENDER) private readonly mail: EmailSender,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ACCOUNTS_OPTIONS) private readonly options: AccountsOptions,
    private readonly sessions: SessionService,
    private readonly throttle: ThrottleService,
    private readonly audit: AuditService,
  ) {}

  /** AC-6.2, AC-6.3, AC-6.4. */
  async request(emailKey: string): Promise<void> {
    const user = await this.users.findOne({ emailKey, role: 'GV' }).lean();
    if (!user) return;
    const now = this.clock.now();
    const recent = await this.resets.countDocuments({
      userId: user._id,
      createdAt: { $gt: new Date(now.getTime() - LINK_TTL_MS) },
    });
    const actor = { actorId: user._id.toString(), workspaceId: user.workspaceId.toString() };
    if (recent >= MAILS_PER_HOUR) {
      await this.audit.record({
        action: 'gv.password_reset.request',
        result: 'denied',
        ...actor,
        details: { reason: 'mail_limit' },
      });
      return;
    }

    const token = randomBytes(32).toString('base64url');
    await this.resets.updateMany(
      { userId: user._id, usedAt: { $exists: false }, supersededAt: { $exists: false } },
      { supersededAt: now },
    );
    const expiresAt = new Date(now.getTime() + LINK_TTL_MS);
    await this.resets.create({
      userId: user._id,
      workspaceId: user.workspaceId,
      tokenHash: sha256(token),
      expiresAt,
      createdAt: now,
      purgeAt: new Date(expiresAt.getTime() + 86_400_000),
    });
    const content = teacherResetMail({
      teacherName: user.displayName,
      resetUrl: `${this.options.appOrigin}/quen-mat-khau?token=${token}`,
    });
    try {
      await this.mail.send({
        to: user.email,
        ...renderMail(content),
        tag: MAIL_TAGS.gvPasswordReset,
        fromName: MAIL_FROM_NAME,
        workspaceId: user.workspaceId.toString(),
      });
      await this.audit.record({
        action: 'gv.password_reset.request',
        ...actor,
        details: { mail: 'accepted' },
      });
    } catch (err) {
      // The screen still shows the generic answer (spec §8); the GV can ask again.
      this.logger.error({ err, userId: user._id.toString() }, 'password reset e-mail failed');
      await this.audit.record({
        action: 'gv.password_reset.request',
        result: 'failed',
        ...actor,
        details: { mail: 'failed' },
      });
    }
  }

  /** AC-6.6: the e-mail of a usable link (shown on the new-password form), else the invalid-link error. */
  async inspect(token: string): Promise<{ email: string }> {
    const { user } = await this.usable(token);
    return { email: user.email };
  }

  /** AC-6.5, AC-4.4. */
  async confirm(token: string, password: string): Promise<void> {
    const { reset, user } = await this.usable(token);
    const now = this.clock.now();
    const claimed = await this.resets.updateOne(
      { _id: (reset as { _id: Types.ObjectId })._id, usedAt: { $exists: false } },
      { usedAt: now },
    );
    if (claimed.modifiedCount !== 1) throw invalidLink();
    await this.users.updateOne(
      { _id: user._id },
      { passwordHash: await hashPassword(password), $inc: { version: 1 } },
    );
    await this.sessions.revokeAll(user._id.toString(), 'password_reset');
    await this.throttle.reset(loginEmailKey(user.emailKey));
    await this.audit.record({
      action: 'gv.password_reset.confirm',
      actorId: user._id.toString(),
      workspaceId: user.workspaceId.toString(),
    });
  }

  private async usable(token: string) {
    const reset = await this.resets.findOne({ tokenHash: sha256(token) }).lean();
    const now = this.clock.now();
    if (!reset || reset.usedAt || reset.supersededAt || reset.expiresAt <= now) throw invalidLink();
    const user = await this.users.findOne({ _id: reset.userId, role: 'GV' }).lean();
    if (!user) throw invalidLink();
    return { reset, user };
  }
}
