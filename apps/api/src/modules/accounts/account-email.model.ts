import type { MailFailReason } from '@sat/shared';
import { Schema, type Types } from 'mongoose';
import { workspaceIdField, workspaceIndex } from '../../common/persistence/base-schema.js';
import type { StudentMailKind } from './accounts.model.js';

export const ACCOUNT_EMAIL_MODEL = 'AccountEmail';

/**
 * One password e-mail to a student ("Thư tài khoản"): its delivery result and the counts behind the
 * sending limits (AC-18.5, AC-18.6). The body — which holds the password — is never stored (NFR-4).
 */
export interface AccountEmailDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  kind: StudentMailKind;
  status: 'sending' | 'accepted' | 'failed';
  failReason?: MailFailReason;
  /** Groups the e-mails of one action (one student or a bulk action) for the T11 result. */
  batchId: Types.ObjectId;
  providerMessageId?: string;
  acceptedAt?: Date;
  createdAt: Date;
  /** TTL: kept 2 days (the 24 h limit and late bounce reports need no more). */
  purgeAt: Date;
}

export const accountEmailSchema = new Schema<AccountEmailDoc>(
  {
    workspaceId: workspaceIdField,
    userId: { type: Schema.Types.ObjectId, required: true },
    kind: { type: String, enum: ['activation', 'new_password'], required: true },
    status: { type: String, enum: ['sending', 'accepted', 'failed'], required: true },
    failReason: { type: String, enum: ['not_accepted', 'bounced'] },
    batchId: { type: Schema.Types.ObjectId, required: true },
    providerMessageId: { type: String },
    acceptedAt: { type: Date },
    createdAt: { type: Date, required: true },
    purgeAt: { type: Date, required: true },
  },
  { collection: 'account_emails', versionKey: false },
);
workspaceIndex(accountEmailSchema, { createdAt: -1 });
workspaceIndex(accountEmailSchema, { userId: 1, createdAt: -1 });
workspaceIndex(accountEmailSchema, { batchId: 1 });
workspaceIndex(accountEmailSchema, { status: 1, createdAt: 1 });
accountEmailSchema.index({ providerMessageId: 1 }, { sparse: true });
accountEmailSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
