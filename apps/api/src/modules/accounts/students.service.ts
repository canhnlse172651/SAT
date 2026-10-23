import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ACCOUNT_ERROR_CODES as E,
  ACCOUNT_MESSAGES as M,
  BULK_MAX,
  type BulkAction,
  type BulkPreview,
  type BulkSelection,
  type MailActionResponse,
  STUDENT_PAGE_SIZE,
  type Student,
  type StudentFilter,
  type StudentListResponse,
  type StudentStatus,
  workspaceMailLimitMessage,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { SessionService } from '../../common/auth/session.service.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { USER_MODEL, type UserDoc, foldText, searchKeyFor } from './accounts.model.js';
import { AuditService } from './audit.service.js';
import { emailTakenError } from './auth.service.js';
import { STUDENT_LINKS, type StudentLinks } from './student-links.js';
import { STUDENT_MAILS_PER_HOUR, StudentMailService } from './student-mail.service.js';

export interface StudentInput {
  displayName: string;
  email: string;
  phone?: string | undefined;
  note?: string | undefined;
}

type Filter = Record<string, unknown>;
type Lean = Omit<UserDoc, never>;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

const statusChanged = () => new AppError(409, E.STATUS_CHANGED, M.statusChanged);
const studentLimit = () => new AppError(429, E.MAIL_LIMIT_STUDENT, M.studentMailLimit);
const workspaceLimit = (remaining: number) =>
  new AppError(429, E.MAIL_LIMIT_WORKSPACE, workspaceMailLimitMessage(remaining), { remaining });

/** T11 / T12 student management (REQ-7, REQ-8, REQ-11 … REQ-13, REQ-18). Every query is workspace-scoped (REQ-16). */
@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    private readonly mail: StudentMailService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    @Inject(STUDENT_LINKS) private readonly links: StudentLinks,
  ) {}

  /* ---------- reading (REQ-11) ---------- */

  async list(
    p: AuthPrincipal,
    query: { q?: string | undefined; status: StudentFilter; page: number },
  ): Promise<StudentListResponse> {
    await this.mail.sweep(p.workspaceId);
    const scope = scoped(this.users, p.workspaceId);
    const filter = this.filterOf(query.q, query.status);
    const [total, docs, groups] = await Promise.all([
      scope.count(filter),
      scope
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * STUDENT_PAGE_SIZE)
        .limit(STUDENT_PAGE_SIZE)
        .lean(),
      scope.aggregate([{ $match: { role: 'HV' } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    ]);
    const by = (s: StudentStatus) =>
      (groups.find((g) => g._id === s)?.n as number | undefined) ?? 0;
    const workspaceTotal = groups.reduce((sum, g) => sum + (g.n as number), 0);
    return {
      items: await this.toDtos(p.workspaceId, docs),
      page: query.page,
      limit: STUDENT_PAGE_SIZE,
      total,
      counts: {
        all: workspaceTotal,
        pending: by('pending'),
        active: by('active') + by('sending'),
        failed: by('failed'),
        locked: by('locked'),
      },
      workspaceTotal,
    };
  }

  async get(p: AuthPrincipal, id: string): Promise<Student> {
    await this.mail.sweep(p.workspaceId);
    const [dto] = await this.toDtos(p.workspaceId, [await this.find(p, id)]);
    return dto as Student;
  }

  /* ---------- add and edit (REQ-8, AC-11.6) ---------- */

  /** AC-8.1, AC-8.4: pending, no password, no e-mail. */
  async create(p: AuthPrincipal, input: StudentInput): Promise<Student> {
    if (await this.users.exists({ emailKey: input.email })) throw emailTakenError();
    let doc: UserDoc;
    try {
      doc = (
        await scoped(this.users, p.workspaceId).create({
          role: 'HV',
          ...this.fields(input),
          status: 'pending',
        })
      ).toObject({ transform: false }) as UserDoc;
    } catch (err) {
      if (isDuplicateKey(err)) throw emailTakenError();
      throw err;
    }
    await this.audit.record({
      action: 'student.create',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: [doc._id.toString()],
    });
    return (await this.toDtos(p.workspaceId, [doc]))[0] as Student;
  }

  /** AC-11.6, AC-12.6: no e-mail is sent; the address cannot change while a mail is being sent. */
  async update(p: AuthPrincipal, id: string, input: StudentInput): Promise<Student> {
    const current = await this.find(p, id);
    if (input.email !== current.email) {
      if (current.status === 'sending') {
        throw new AppError(409, E.STATUS_CHANGED, 'Đang gửi email — chưa đổi được Email.', {
          field: 'email',
        });
      }
      if (await this.users.exists({ emailKey: input.email, _id: { $ne: current._id } }))
        throw emailTakenError();
    }
    const fields = this.fields(input);
    let updated: UserDoc | null;
    try {
      updated = await scoped(this.users, p.workspaceId)
        .findOneAndUpdate(
          { _id: current._id, role: 'HV' },
          {
            $set: {
              displayName: fields.displayName,
              email: fields.email,
              emailKey: fields.emailKey,
              searchKey: fields.searchKey,
              ...(fields.phone ? { phone: fields.phone } : {}),
              ...(fields.note ? { note: fields.note } : {}),
            },
            $unset: { ...(fields.phone ? {} : { phone: 1 }), ...(fields.note ? {} : { note: 1 }) },
            $inc: { version: 1 },
          },
          { returnDocument: 'after' },
        )
        .lean();
    } catch (err) {
      if (isDuplicateKey(err)) throw emailTakenError();
      throw err;
    }
    if (!updated) throw notFound();
    await this.audit.record({
      action: 'student.update',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: [id],
      details: { emailChanged: input.email !== current.email },
    });
    return (await this.toDtos(p.workspaceId, [updated]))[0] as Student;
  }

  /* ---------- password e-mails (REQ-7, REQ-12, REQ-18) ---------- */

  /** AC-7.1 */
  activate(p: AuthPrincipal, id: string): Promise<MailActionResponse> {
    return this.single(p, id, 'student.activate', {
      from: ['pending'],
      kind: 'activation',
      perStudentLimit: false,
      endSessions: false,
    });
  }

  /** AC-18.4 (one student): the kind that failed, to the current address. */
  resend(p: AuthPrincipal, id: string): Promise<MailActionResponse> {
    return this.single(p, id, 'student.resend', {
      from: ['failed'],
      kind: 'same',
      perStudentLimit: true,
      endSessions: false,
    });
  }

  /** AC-12.1 */
  resetPassword(p: AuthPrincipal, id: string): Promise<MailActionResponse> {
    return this.single(p, id, 'student.reset_password', {
      from: ['active'],
      kind: 'new_password',
      perStudentLimit: true,
      endSessions: true,
    });
  }

  /** AC-7.2: what the confirmation dialog states. */
  async preview(
    p: AuthPrincipal,
    action: BulkAction,
    selection: BulkSelection,
  ): Promise<BulkPreview> {
    const { selected, eligible } = await this.resolveBulk(p, action, selection);
    return { eligible: eligible.length, skipped: selected - eligible.length };
  }

  /** AC-7.3 … AC-7.5, AC-18.4 (many), AC-18.6. */
  async bulk(
    p: AuthPrincipal,
    action: BulkAction,
    selection: BulkSelection,
  ): Promise<MailActionResponse> {
    const { selected, eligible } = await this.resolveBulk(p, action, selection);
    if (!eligible.length) {
      throw new AppError(
        400,
        E.NOTHING_ELIGIBLE,
        action === 'activate' ? M.noPendingSelected : M.noFailedSelected,
      );
    }
    if (eligible.length > BULK_MAX) {
      throw new AppError(
        400,
        E.BULK_LIMIT,
        action === 'activate' ? M.bulkLimit : M.bulkResendLimit,
      );
    }
    await this.requireWorkspaceQuota(p, eligible.length);
    const { batchId, claimed } = await this.mail.issue({
      workspaceId: p.workspaceId,
      actorId: p.userId,
      teacherName: await this.teacherName(p),
      targets: eligible.map((student) => ({
        student,
        kind: action === 'activate' ? 'activation' : 'same',
        from: [action === 'activate' ? 'pending' : 'failed'],
      })),
      endSessions: false,
    });
    await this.audit.record({
      action: `student.bulk_${action}`,
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: claimed,
      details: { selected, queued: claimed.length },
    });
    return {
      batchId: claimed.length ? batchId : null,
      queued: claimed.length,
      skipped: selected - claimed.length,
    };
  }

  /* ---------- lock, unlock, delete (REQ-12, REQ-13) ---------- */

  /** AC-12.2: data and memberships are kept; every session ends. */
  async lock(p: AuthPrincipal, id: string): Promise<Student> {
    const student = await this.find(p, id);
    if (student.status !== 'active' && student.status !== 'failed') throw statusChanged();
    const locked = await scoped(this.users, p.workspaceId)
      .findOneAndUpdate(
        { _id: student._id, role: 'HV', status: student.status },
        { $set: { status: 'locked', statusBeforeLock: student.status }, $inc: { version: 1 } },
        { returnDocument: 'after' },
      )
      .lean();
    if (!locked) throw statusChanged();
    await this.sessions.revokeAll(id, 'locked');
    await this.audit.record({
      action: 'student.lock',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: [id],
    });
    return (await this.toDtos(p.workspaceId, [locked]))[0] as Student;
  }

  /** AC-12.4: back to the state before the lock; same password, no e-mail. */
  async unlock(p: AuthPrincipal, id: string): Promise<Student> {
    const student = await this.find(p, id);
    if (student.status !== 'locked') throw statusChanged();
    const unlocked = await scoped(this.users, p.workspaceId)
      .findOneAndUpdate(
        { _id: student._id, role: 'HV', status: 'locked' },
        {
          $set: { status: student.statusBeforeLock ?? 'active' },
          $unset: { statusBeforeLock: 1 },
          $inc: { version: 1 },
        },
        { returnDocument: 'after' },
      )
      .lean();
    if (!unlocked) throw statusChanged();
    await this.audit.record({
      action: 'student.unlock',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: [id],
    });
    return (await this.toDtos(p.workspaceId, [unlocked]))[0] as Student;
  }

  /** AC-13.2, AC-13.3, AC-20.6: only without submissions (self-study data is not a submission). */
  async remove(p: AuthPrincipal, id: string): Promise<void> {
    const student = await this.find(p, id);
    if (await this.links.hasSubmissions(p.workspaceId, id)) {
      await this.audit.record({
        action: 'student.delete',
        result: 'denied',
        actorId: p.userId,
        workspaceId: p.workspaceId,
        targetIds: [id],
        details: { reason: 'has_submissions' },
      });
      throw new AppError(409, E.HAS_SUBMISSIONS, M.hasSubmissions);
    }
    const deleted = await scoped(this.users, p.workspaceId).deleteOne({
      _id: student._id,
      role: 'HV',
    });
    if (deleted.deletedCount !== 1) throw notFound();
    await this.sessions.revokeAll(id, 'expired');
    await this.links.onStudentDeleted(p.workspaceId, id);
    await this.audit.record({
      action: 'student.delete',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: [id],
    });
  }

  /* ---------- helpers ---------- */

  private async single(
    p: AuthPrincipal,
    id: string,
    action: string,
    rule: {
      from: StudentStatus[];
      kind: 'activation' | 'new_password' | 'same';
      perStudentLimit: boolean;
      endSessions: boolean;
    },
  ): Promise<MailActionResponse> {
    const student = await this.find(p, id);
    if (!rule.from.includes(student.status)) throw statusChanged();
    if (
      rule.perStudentLimit &&
      (await this.mail.sentLastHour(p.workspaceId, student._id)) >= STUDENT_MAILS_PER_HOUR
    ) {
      await this.audit.record({
        action,
        result: 'denied',
        actorId: p.userId,
        workspaceId: p.workspaceId,
        targetIds: [id],
        details: { reason: 'student_mail_limit' },
      });
      throw studentLimit();
    }
    await this.requireWorkspaceQuota(p, 1, action);
    const { batchId, claimed } = await this.mail.issue({
      workspaceId: p.workspaceId,
      actorId: p.userId,
      teacherName: await this.teacherName(p),
      targets: [{ student, kind: rule.kind, from: rule.from }],
      endSessions: rule.endSessions,
    });
    if (!claimed.length) throw statusChanged();
    await this.audit.record({
      action,
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: [id],
    });
    return { batchId, queued: 1, skipped: 0 };
  }

  private async requireWorkspaceQuota(
    p: AuthPrincipal,
    needed: number,
    action = 'student.bulk',
  ): Promise<void> {
    const remaining = await this.mail.workspaceRemaining(p.workspaceId);
    if (needed > remaining) {
      await this.audit.record({
        action,
        result: 'denied',
        actorId: p.userId,
        workspaceId: p.workspaceId,
        details: { reason: 'workspace_mail_limit', needed, remaining },
      });
      throw workspaceLimit(remaining);
    }
  }

  /** Selected students of this workspace and those the action applies to (re-checked at confirmation — AC-7.5). */
  private async resolveBulk(p: AuthPrincipal, action: BulkAction, selection: BulkSelection) {
    const scope = scoped(this.users, p.workspaceId);
    const filter =
      'ids' in selection
        ? { role: 'HV', _id: { $in: selection.ids.map((id) => new Types.ObjectId(id)) } }
        : this.filterOf(selection.filter.q, selection.filter.status);
    const docs = await scope.find(filter).select({ _id: 1, status: 1 }).lean();
    const wanted: StudentStatus = action === 'activate' ? 'pending' : 'failed';
    let eligible = docs.filter((d) => d.status === wanted);
    if (action === 'resend') {
      const counts = await Promise.all(
        eligible.map((d) => this.mail.sentLastHour(p.workspaceId, d._id)),
      );
      eligible = eligible.filter((_, i) => (counts[i] ?? 0) < STUDENT_MAILS_PER_HOUR);
    }
    return { selected: docs.length, eligible };
  }

  private filterOf(q: string | undefined, status: StudentFilter): Filter {
    const filter: Filter = { role: 'HV' };
    if (status === 'active') filter['status'] = { $in: ['active', 'sending'] };
    else if (status !== 'all') filter['status'] = status;
    const term = foldText((q ?? '').trim());
    if (term) filter['searchKey'] = { $regex: escapeRegex(term) };
    return filter;
  }

  private fields(input: StudentInput) {
    return {
      displayName: input.displayName,
      email: input.email,
      emailKey: input.email,
      searchKey: searchKeyFor(input.displayName, input.email),
      phone: input.phone,
      note: input.note,
    };
  }

  /** The student, or the uniform 404 for a missing / foreign / malformed id or a non-student (AC-16.2). */
  private async find(p: AuthPrincipal, id: string): Promise<Lean> {
    const doc = await scoped(this.users, p.workspaceId).findById(id).lean();
    if (!doc || doc.role !== 'HV') throw notFound();
    return doc;
  }

  private async teacherName(p: AuthPrincipal): Promise<string> {
    const gv = await scoped(this.users, p.workspaceId)
      .findById(p.userId)
      .select({ displayName: 1 })
      .lean();
    return gv?.displayName ?? '';
  }

  private async toDtos(workspaceId: string, docs: Lean[]): Promise<Student[]> {
    const counts = await this.links.classCounts(
      workspaceId,
      docs.map((d) => d._id.toString()),
    );
    return docs.map((d) => ({
      id: d._id.toString(),
      displayName: d.displayName,
      email: d.email,
      phone: d.phone ?? null,
      note: d.note ?? null,
      status: d.status,
      failReason: d.status === 'failed' ? (d.failReason ?? null) : null,
      mailKind: d.mailKind ?? null,
      classCount: counts.get(d._id.toString()) ?? 0,
      lastLoginAt: d.lastLoginAt ? d.lastLoginAt.toISOString() : null,
      createdAt: d.createdAt.toISOString(),
    }));
  }
}
