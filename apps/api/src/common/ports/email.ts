import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Schema, type Model } from 'mongoose';

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

/** Dev adapter: persists the message to `dev_outbox` instead of sending it. */
@Injectable()
export class DevOutboxEmailSender implements EmailSender {
  private readonly logger = new Logger('DevOutbox');

  constructor(@InjectModel(DEV_OUTBOX_MODEL) private readonly model: Model<OutboxDoc>) {}

  async send(message: EmailMessage): Promise<{ id: string }> {
    const doc = await this.model.create(message);
    const id = doc._id.toString();
    // No recipient or body in logs (PII).
    this.logger.log({ msg: 'email stored in dev outbox', id, tag: message.tag });
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
