import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Schema, type Model } from 'mongoose';
import { CLOCK, type Clock } from './clock.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Machine-readable kind, e.g. 'activation'; lets e2e find a message. */
  tag: string;
  workspaceId?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<{ id: string }>;
}

/** Injection token for the EmailSender port. */
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

/** Thrown by `send` when the provider refuses the message for good (retrying cannot help). */
export class EmailRejectedError extends Error {
  readonly permanent = true;
  constructor(message = 'Recipient refused by the e-mail provider') {
    super(message);
    this.name = 'EmailRejectedError';
  }
}

/** Something the provider reports after accepting a message (001 AC-18.2: the address cannot receive mail). */
export interface EmailEvent {
  messageId: string;
  type: 'bounced';
  at: Date;
}
export type EmailEventListener = (event: EmailEvent) => Promise<void> | void;

/** Injection token for the EmailEvents bus (provider webhooks / the dev simulation publish here). */
export const EMAIL_EVENTS = Symbol('EMAIL_EVENTS');

/** In-process bus for provider events; listeners run one after another and their errors are logged. */
export class EmailEvents {
  private readonly listeners: EmailEventListener[] = [];
  private readonly logger = new Logger('EmailEvents');

  on(listener: EmailEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i >= 0) this.listeners.splice(i, 1);
    };
  }

  async emit(event: EmailEvent): Promise<void> {
    for (const listener of [...this.listeners]) {
      try {
        await listener(event);
      } catch (err) {
        this.logger.error({ err, messageId: event.messageId }, 'email event listener failed');
      }
    }
  }
}

/** Options of the dev adapter (`DEV_EMAIL_DELAY_MS`). */
export const DEV_EMAIL_OPTIONS = Symbol('DEV_EMAIL_OPTIONS');
export interface DevEmailOptions {
  /** How long `send` takes, so "sending" states are visible in the UI. */
  delayMs: number;
}

/**
 * Dev provider simulation for recipients on the reserved `.invalid` TLD (RFC 2606): `reject@….invalid` is refused,
 * `late-bounce@….invalid` bounces after 10 s, any other `….invalid` address bounces after 1 s. Others are delivered.
 */
export function devDeliveryOutcome(to: string): { refuse: boolean; bounceAfterMs: number | null } {
  const at = to.lastIndexOf('@');
  const local = to.slice(0, at).toLowerCase();
  const domain = to.slice(at + 1).toLowerCase();
  if (at < 1 || !domain.endsWith('.invalid')) return { refuse: false, bounceAfterMs: null };
  if (local === 'reject') return { refuse: true, bounceAfterMs: null };
  return { refuse: false, bounceAfterMs: local === 'late-bounce' ? 10_000 : 1_000 };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface StoredEmail extends EmailMessage {
  id: string;
  createdAt: Date;
}

export const DEV_OUTBOX_MODEL = 'DevOutbox';

export const devOutboxSchema = new Schema(
  {
    to: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    text: { type: String, required: true },
    tag: { type: String, required: true },
    workspaceId: { type: String },
  },
  { collection: 'dev_outbox', timestamps: { createdAt: true, updatedAt: false } },
);
devOutboxSchema.index({ createdAt: -1 });

interface OutboxDoc extends Omit<EmailMessage, 'workspaceId'> {
  _id: { toString(): string };
  workspaceId?: string | null;
  createdAt: Date;
}

function toStored(doc: OutboxDoc): StoredEmail {
  const { _id, workspaceId, createdAt, to, subject, html, text, tag } = doc;
  return {
    id: _id.toString(),
    to,
    subject,
    html,
    text,
    tag,
    ...(workspaceId ? { workspaceId } : {}),
    createdAt,
  };
}

/** Dev adapter: persists the message to `dev_outbox` instead of sending it, and simulates a provider (`devDeliveryOutcome`). */
@Injectable()
export class DevOutboxEmailSender implements EmailSender {
  private readonly logger = new Logger('DevOutbox');

  constructor(
    @InjectModel(DEV_OUTBOX_MODEL) private readonly model: Model<OutboxDoc>,
    @Inject(EMAIL_EVENTS) private readonly events: EmailEvents,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(DEV_EMAIL_OPTIONS) private readonly options?: DevEmailOptions,
  ) {}

  async send(message: EmailMessage): Promise<{ id: string }> {
    const delayMs = this.options?.delayMs ?? 0;
    if (delayMs > 0) await sleep(delayMs);
    const outcome = devDeliveryOutcome(message.to);
    if (outcome.refuse) {
      this.logger.log({ msg: 'dev outbox refused email (simulation)', tag: message.tag });
      throw new EmailRejectedError();
    }
    const doc = await this.model.create(message);
    const id = doc._id.toString();
    // No recipient or body in logs (PII).
    this.logger.log({ msg: 'email stored in dev outbox', id, tag: message.tag });
    if (outcome.bounceAfterMs !== null) {
      setTimeout(() => {
        void this.events.emit({ messageId: id, type: 'bounced', at: this.clock.now() });
      }, outcome.bounceAfterMs).unref();
    }
    return { id };
  }
}

/** Reads the dev outbox for e2e/dev endpoints. */
@Injectable()
export class DevOutboxReader {
  constructor(@InjectModel(DEV_OUTBOX_MODEL) private readonly model: Model<OutboxDoc>) {}

  async latest(limit = 20): Promise<StoredEmail[]> {
    const n = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const docs = await this.model.find().sort({ createdAt: -1, _id: -1 }).limit(n).lean();
    return docs.map((d) => toStored(d as OutboxDoc));
  }

  async findByRecipient(to: string, tag?: string): Promise<StoredEmail[]> {
    const docs = await this.model
      .find({ to, ...(tag ? { tag } : {}) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();
    return docs.map((d) => toStored(d as OutboxDoc));
  }
}

/** Unit-test adapter: keeps messages in memory. */
export class MemoryEmailSender implements EmailSender {
  readonly sent: StoredEmail[] = [];

  send(message: EmailMessage): Promise<{ id: string }> {
    const id = `mem-${this.sent.length + 1}`;
    this.sent.push({ ...message, id, createdAt: new Date() });
    return Promise.resolve({ id });
  }

  find(to: string, tag?: string): StoredEmail[] {
    return this.sent.filter((m) => m.to === to && (tag === undefined || m.tag === tag));
  }
}
