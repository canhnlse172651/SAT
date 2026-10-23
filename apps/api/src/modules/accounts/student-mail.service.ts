import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type EmailBatch, MAIL_TAGS, type StudentStatus } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { hashPassword } from '../../common/auth/password.js';
import { SessionService } from '../../common/auth/session.service.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import {
  EMAIL_EVENTS,
  EMAIL_SENDER,
  type EmailEvent,
  EmailEvents,
  type EmailSender,
} from '../../common/ports/email.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { ACCOUNT_EMAIL_MODEL, type AccountEmailDoc } from './account-email.model.js';
import {
  MAIL_FROM_NAME,
  activationMail,
  newPasswordMail,
  renderMail,
} from './account-mail.templates.js';
import { type StudentMailKind, USER_MODEL, type UserDoc } from './accounts.model.js';
import { ACCOUNTS_OPTIONS, type AccountsOptions } from './accounts.options.js';
import { AuditService } from './audit.service.js';
import { loginEmailKey } from './auth.service.js';
import { randomPassword } from './passwords.js';
import { ThrottleService } from './throttle.service.js';

const MINUTE = 60_000;
/** AC-18.2: a mail not accepted within 10 minutes of tries has failed. */
const DELIVERY_WINDOW_MS = 10 * MINUTE;
const RETRY_DELAYS_MS = [5_000, 30_000, 2 * MINUTE, 5 * MINUTE];
/** AC-18.2: bounce reports count for 24 hours after acceptance. */
const BOUNCE_WINDOW_MS = 24 * 60 * MINUTE;
export const STUDENT_MAILS_PER_HOUR = 3;
export const WORKSPACE_MAILS_PER_DAY = 1_000;

export interface MailTarget {
  student: Pick<UserDoc, '_id'>;
  kind: StudentMailKind | 'same';
  /** The student is claimed only while still in one of these states (AC-7.5). */
  from: StudentStatus[];
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms).unref?.());

/**
 * Password e-mails to students (REQ-7, REQ-12, REQ-18): claims the student atomically, hands the
 * message to the e-mail port in the background with retries, and turns the provider's answers into
 * the student's status. Passwords exist only in memory until they are hashed and sent.
 */
@Injectable()
export class StudentMailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('StudentMail');
  private unsubscribe: (() => void) | undefined;

  constructor(
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @InjectModel(ACCOUNT_EMAIL_MODEL) private readonly emails: Model<AccountEmailDoc>,
    @Inject(EMAIL_SENDER) private readonly sender: EmailSender,
    @Inject(EMAIL_EVENTS) private readonly events: EmailEvents,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ACCOUNTS_OPTIONS) private readonly options: AccountsOptions,
    private readonly sessions: SessionService,
    private readonly throttle: ThrottleService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit(): void {
    this.unsubscribe = this.events.on((event) => this.onProviderEvent(event));
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
  }

  /** AC-18.6: password e-mails the workspace may still send in the rolling 24 hours. */
  async workspaceRemaining(workspaceId: string): Promise<number> {
    const since = new Date(this.clock.now().getTime() - 24 * 60 * MINUTE);
    const sent = await scoped(this.emails, workspaceId).count({ createdAt: { $gt: since } });
    return Math.max(0, WORKSPACE_MAILS_PER_DAY - sent);
  }

  /** AC-18.5: password e-mails sent to one student in the last 60 minutes. */
  async sentLastHour(workspaceId: string, studentId: Types.ObjectId): Promise<number> {
    const since = new Date(this.clock.now().getTime() - 60 * MINUTE);
    return scoped(this.emails, workspaceId).count({ userId: studentId, createdAt: { $gt: since } });
  }

  /**
   * Claims each student still in `from` (status → "Đang gửi email") and records its e-mail, then
   * creates the password and sends in the background. Returns the batch and the claimed ids; the
   * others were skipped. `endSessions` ends every session of the student (reset password, AC-12.1).
   */
  async issue(input: {
    workspaceId: string;
    actorId: string;
    teacherName: string;
    targets: MailTarget[];
    endSessions: boolean;
  }): Promise<{ batchId: string; claimed: string[] }> {
    const users = scoped(this.users, input.workspaceId);
    const batchId = new Types.ObjectId();
    const claimed: { user: UserDoc; recordId: Types.ObjectId; kind: StudentMailKind }[] = [];
    for (const target of input.targets) {
      const recordId = new Types.ObjectId();
      const current = await users.findById(target.student._id).lean();
      if (!current) continue;
      const kind: StudentMailKind =
        target.kind === 'same' ? (current.mailKind ?? 'activation') : target.kind;
      const user = await users
        .findOneAndUpdate(
          { _id: current._id, status: { $in: target.from } },
          {
            $set: { status: 'sending', mailKind: kind, currentMailId: recordId },
            $unset: { failReason: 1 },
            $inc: { version: 1 },
          },
          { returnDocument: 'after' },
        )
        .lean();
      if (!user) continue;
      const now = this.clock.now();
      await this.emails.create({
        _id: recordId,
        workspaceId: user.workspaceId,
        userId: user._id,
        kind,
        status: 'sending',
        batchId,
        createdAt: now,
        purgeAt: new Date(now.getTime() + 2 * BOUNCE_WINDOW_MS),
      });
      if (input.endSessions) await this.sessions.revokeAll(user._id.toString(), 'password_reset');
      claimed.push({ user, recordId, kind });
    }
    void this.sendAll(claimed, input.teacherName).catch((err: unknown) =>
      this.logger.error({ err, batchId: batchId.toString() }, 'password e-mails failed'),
    );
    return { batchId: batchId.toString(), claimed: claimed.map((c) => c.user._id.toString()) };
  }

  /** Progress of one action's e-mails (T11 polls it until nothing is sending). */
  async batch(workspaceId: string, batchId: string): Promise<EmailBatch> {
    await this.sweep(workspaceId);
    if (!Types.ObjectId.isValid(batchId)) throw notFound();
    const rows = await scoped(this.emails, workspaceId).aggregate([
      { $match: { batchId: new Types.ObjectId(batchId) } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]);
    if (!rows.length) throw notFound();
    const count = (s: string) => (rows.find((r) => r._id === s)?.n as number | undefined) ?? 0;
    const sending = count('sending');
    const sent = count('accepted');
    const failed = count('failed');
    return { id: batchId, total: sending + sent + failed, sending, sent, failed };
  }

  /** AC-18.2: e-mails still "sending" past the 10-minute window have failed (e.g. after a restart). */
  async sweep(workspaceId: string): Promise<void> {
    const before = new Date(this.clock.now().getTime() - DELIVERY_WINDOW_MS - MINUTE);
    const stale = await scoped(this.emails, workspaceId)
      .find({ status: 'sending', createdAt: { $lt: before } })
      .select({ _id: 1 })
      .lean();
    for (const record of stale) await this.markFailed(record._id, 'not_accepted');
  }

  private async sendAll(
    claimed: { user: UserDoc; recordId: Types.ObjectId; kind: StudentMailKind }[],
    teacherName: string,
  ): Promise<void> {
    for (const { user, recordId, kind } of claimed) {
      const password = randomPassword();
      const set = await this.users.updateOne(
        { _id: user._id, currentMailId: recordId },
        { passwordHash: await hashPassword(password), passwordSource: 'system' },
      );
      // Re-claimed or deleted meanwhile: this e-mail is obsolete.
      if (set.matchedCount !== 1) {
        await this.markFailed(recordId, 'not_accepted');
        continue;
      }
      await this.throttle.reset(loginEmailKey(user.emailKey));
      const input = {
        studentName: user.displayName,
        teacherName,
        email: user.email,
        password,
        loginUrl: `${this.options.appOrigin}/dang-nhap`,
      };
      const content = kind === 'activation' ? activationMail(input) : newPasswordMail(input);
      void this.deliver(recordId, {
        to: user.email,
        ...renderMail(content),
        tag: kind === 'activation' ? MAIL_TAGS.activation : MAIL_TAGS.newPassword,
        fromName: MAIL_FROM_NAME,
        workspaceId: user.workspaceId.toString(),
      });
    }
  }

  private async deliver(
    recordId: Types.ObjectId,
    message: Parameters<EmailSender['send']>[0],
  ): Promise<void> {
    const started = this.clock.now().getTime();
    for (let attempt = 0; ; attempt++) {
      try {
        const { id } = await this.sender.send(message);
        await this.markAccepted(recordId, id);
        return;
      } catch (err) {
        const permanent = (err as { permanent?: boolean }).permanent === true;
        const delay = RETRY_DELAYS_MS[attempt];
        const elapsed = this.clock.now().getTime() - started;
        if (permanent || delay === undefined || elapsed + delay > DELIVERY_WINDOW_MS) {
          this.logger.warn({
            msg: 'password e-mail not accepted',
            recordId: recordId.toString(),
            permanent,
          });
          await this.markFailed(recordId, 'not_accepted');
          return;
        }
        await sleep(delay);
      }
    }
  }

  private async markAccepted(recordId: Types.ObjectId, providerMessageId: string): Promise<void> {
    const now = this.clock.now();
    const record = await this.emails
      .findOneAndUpdate(
        { _id: recordId, status: 'sending' },
        { status: 'accepted', acceptedAt: now, providerMessageId },
        { returnDocument: 'after' },
      )
      .lean();
    if (!record) return;
    const user = await this.users.findOneAndUpdate(
      { _id: record.userId, currentMailId: recordId, status: 'sending' },
      { $set: { status: 'active' }, $unset: { failReason: 1 } },
    );
    if (user) {
      await this.users.updateOne(
        { _id: record.userId, activatedAt: { $exists: false } },
        { activatedAt: now },
      );
    }
    await this.audit.record({
      action: 'student.mail.result',
      workspaceId: record.workspaceId.toString(),
      targetIds: [record.userId.toString()],
      details: { kind: record.kind, result: 'accepted' },
    });
  }

  private async markFailed(
    recordId: Types.ObjectId,
    reason: 'not_accepted' | 'bounced',
  ): Promise<void> {
    const record = await this.emails
      .findOneAndUpdate(
        { _id: recordId, status: { $ne: 'failed' } },
        { status: 'failed', failReason: reason },
        { returnDocument: 'after' },
      )
      .lean();
    if (!record) return;
    const owns = { _id: record.userId, currentMailId: recordId };
    await this.users.updateOne(
      { ...owns, status: { $in: ['sending', 'active'] } },
      { status: 'failed', failReason: reason },
    );
    // Locked meanwhile: unlocking returns to "Gửi email thất bại" (AC-12.4).
    await this.users.updateOne(
      { ...owns, status: 'locked' },
      { statusBeforeLock: 'failed', failReason: reason },
    );
    await this.audit.record({
      action: 'student.mail.result',
      result: 'failed',
      workspaceId: record.workspaceId.toString(),
      targetIds: [record.userId.toString()],
      details: { kind: record.kind, reason },
    });
  }

  /** AC-18.2: "address cannot receive mail" within 24 h of acceptance; later reports change nothing. */
  private async onProviderEvent(event: EmailEvent): Promise<void> {
    if (event.type !== 'bounced') return;
    const record = await this.emails.findOne({ providerMessageId: event.messageId }).lean();
    if (!record?.acceptedAt) return;
    if (event.at.getTime() - record.acceptedAt.getTime() > BOUNCE_WINDOW_MS) return;
    await this.markFailed(record._id, 'bounced');
  }
}
