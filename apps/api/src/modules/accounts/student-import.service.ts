import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ACCOUNT_ERROR_CODES as E,
  ACCOUNT_MESSAGES as M,
  IMPORT_MAX_BYTES,
  IMPORT_MAX_ROWS,
  type ImportReport,
  type ImportResult,
  fieldErrors,
  studentBodySchema,
} from '@sat/shared';
import { type Model, Schema, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { workspaceIdField, workspaceIndex } from '../../common/persistence/base-schema.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { USER_MODEL, type UserDoc, foldText, searchKeyFor } from './accounts.model.js';
import { AuditService } from './audit.service.js';
import { InvalidXlsxError, readFirstSheet } from './xlsx.js';

export const STUDENT_IMPORT_MODEL = 'StudentImport';

interface ImportRow {
  line: number;
  displayName: string;
  email: string;
  phone?: string;
  note?: string;
  /** Field problems of the row itself (fixed for the life of the import). */
  fieldReason?: string;
  /** Recomputed on every check: duplicates in the file, e-mails already used. */
  reason?: string;
}

/** "Lượt import": the parsed rows of one uploaded file, kept until confirmed (TTL 1 day). */
export interface StudentImportDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  createdBy: Types.ObjectId;
  rows: ImportRow[];
  createdAt: Date;
  expiresAt: Date;
}

const importRowSchema = new Schema<ImportRow>(
  {
    line: { type: Number, required: true },
    displayName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String },
    note: { type: String },
    fieldReason: { type: String },
    reason: { type: String },
  },
  { _id: false },
);

export const studentImportSchema = new Schema<StudentImportDoc>(
  {
    workspaceId: workspaceIdField,
    createdBy: { type: Schema.Types.ObjectId, required: true },
    rows: { type: [importRowSchema], required: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'student_imports', versionKey: false },
);
workspaceIndex(studentImportSchema, { createdAt: -1 });
studentImportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const invalidFile = () => new AppError(400, E.INVALID_IMPORT_FILE, M.invalidImportFile);
const FIELD_ORDER = ['displayName', 'email', 'phone', 'note'] as const;
const HEADERS: Record<string, (typeof FIELD_ORDER)[number]> = {
  'ho ten': 'displayName',
  email: 'email',
  'so dien thoai': 'phone',
  'ghi chu': 'note',
};
const headerKey = (h: string) => foldText(h).trim().replace(/\s+/g, ' ');

/** REQ-9, REQ-10: check an Excel file, then add its valid rows as pending students in one go. */
@Injectable()
export class StudentImportService {
  constructor(
    @InjectModel(STUDENT_IMPORT_MODEL) private readonly imports: Model<StudentImportDoc>,
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly audit: AuditService,
  ) {}

  /** AC-9.2 … AC-9.5: nothing is added here. */
  async check(p: AuthPrincipal, bytes: Uint8Array): Promise<ImportReport> {
    if (!bytes.length || bytes.length > IMPORT_MAX_BYTES) throw invalidFile();
    let sheet;
    try {
      sheet = readFirstSheet(bytes);
    } catch (err) {
      if (err instanceof InvalidXlsxError) throw invalidFile();
      throw err;
    }
    const [header, ...data] = sheet;
    const columns = new Map<(typeof FIELD_ORDER)[number], number>();
    (header?.cells ?? []).forEach((cell, i) => {
      const field = HEADERS[headerKey(cell)];
      if (field && !columns.has(field)) columns.set(field, i);
    });
    if (!columns.has('displayName') || !columns.has('email')) {
      throw new AppError(400, E.INVALID_IMPORT_FILE, M.importMissingColumns);
    }
    const cell = (cells: string[], f: (typeof FIELD_ORDER)[number]) => {
      const i = columns.get(f);
      return i === undefined ? '' : (cells[i] ?? '').trim();
    };
    const filled = data.filter((r) => FIELD_ORDER.some((f) => cell(r.cells, f) !== ''));
    if (!filled.length) throw new AppError(400, E.INVALID_IMPORT_FILE, M.importNoRows);
    if (filled.length > IMPORT_MAX_ROWS)
      throw new AppError(400, E.INVALID_IMPORT_FILE, M.importTooManyRows);

    const rows: ImportRow[] = filled.map(({ line, cells }) => {
      const raw = Object.fromEntries(FIELD_ORDER.map((f) => [f, cell(cells, f)]));
      const parsed = studentBodySchema.safeParse(raw);
      if (parsed.success) {
        const { displayName, email, phone, note } = parsed.data;
        return { line, displayName, email, ...(phone ? { phone } : {}), ...(note ? { note } : {}) };
      }
      const errors = fieldErrors(parsed.error.issues);
      return {
        line,
        displayName: raw['displayName'] ?? '',
        email: (raw['email'] ?? '').toLowerCase(),
        fieldReason: FIELD_ORDER.map((f) => errors[f])
          .filter(Boolean)
          .join(' '),
      };
    });
    await this.recheck(rows);
    const now = this.clock.now();
    const doc = await scoped(this.imports, p.workspaceId).create({
      createdBy: new Types.ObjectId(p.userId),
      rows,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 86_400_000),
    });
    await this.audit.record({
      action: 'student.import.check',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      details: { rows: rows.length, valid: rows.filter((r) => this.valid(r)).length },
    });
    return this.report(doc._id.toString(), rows);
  }

  /** AC-10.1, AC-10.3, AC-10.5: all valid rows or none; a changed file state returns the new report (409). */
  async confirm(p: AuthPrincipal, importId: string): Promise<ImportResult> {
    const doc = await scoped(this.imports, p.workspaceId).findById(importId).lean();
    if (!doc) throw notFound();
    const before = new Set(doc.rows.filter((r) => this.valid(r)).map((r) => r.line));
    const rows = doc.rows.map((r) => ({ ...r }));
    await this.recheck(rows);
    const valid = rows.filter((r) => this.valid(r));
    if (!before.size || !valid.length) {
      throw new AppError(400, E.NOTHING_ELIGIBLE, M.importNothingValid, {
        report: this.report(importId, rows),
      });
    }
    if (valid.length !== before.size) return this.changed(p, importId, rows);

    const now = this.clock.now();
    const docs = valid.map((r) => ({
      _id: new Types.ObjectId(),
      workspaceId: new Types.ObjectId(p.workspaceId),
      role: 'HV' as const,
      displayName: r.displayName,
      email: r.email,
      emailKey: r.email,
      searchKey: searchKeyFor(r.displayName, r.email),
      ...(r.phone ? { phone: r.phone } : {}),
      ...(r.note ? { note: r.note } : {}),
      status: 'pending' as const,
      importId: doc._id,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }));
    try {
      await this.users.insertMany(docs, { ordered: true });
    } catch {
      // An address was taken meanwhile, or the write broke off: undo this confirmation entirely.
      await scoped(this.users, p.workspaceId).deleteMany({ importId: doc._id, role: 'HV' });
      await this.recheck(rows);
      return this.changed(p, importId, rows);
    }
    await scoped(this.imports, p.workspaceId).deleteOne({ _id: doc._id });
    await this.audit.record({
      action: 'student.import.confirm',
      actorId: p.userId,
      workspaceId: p.workspaceId,
      targetIds: docs.map((d) => d._id.toString()),
    });
    return {
      added: docs.map((d) => ({
        id: d._id.toString(),
        displayName: d.displayName,
        email: d.email,
      })),
    };
  }

  private async changed(p: AuthPrincipal, importId: string, rows: ImportRow[]): Promise<never> {
    await scoped(this.imports, p.workspaceId).updateOne(
      { _id: new Types.ObjectId(importId) },
      { rows },
    );
    throw new AppError(
      409,
      E.IMPORT_CHANGED,
      'Một số dòng không còn hợp lệ. Vui lòng xem lại báo cáo và xác nhận lại.',
      {
        report: this.report(importId, rows),
      },
    );
  }

  /** AC-9.5 then AC-8.4: duplicates within the file, e-mails used by any account (Q-1). */
  private async recheck(rows: ImportRow[]): Promise<void> {
    const byEmail = new Map<string, number[]>();
    for (const r of rows) {
      if (r.fieldReason || !r.email) continue;
      byEmail.set(r.email, [...(byEmail.get(r.email) ?? []), r.line]);
    }
    const candidates = [...byEmail.keys()];
    const taken = new Set(
      (
        await this.users
          .find({ emailKey: { $in: candidates } })
          .select({ emailKey: 1 })
          .lean()
      ).map((u) => u.emailKey),
    );
    for (const r of rows) {
      delete r.reason;
      if (r.fieldReason) continue;
      const lines = byEmail.get(r.email) ?? [];
      if (lines.length > 1) r.reason = `Email bị trùng trong tệp (dòng ${lines.join(', ')})`;
      else if (taken.has(r.email)) r.reason = M.emailTaken;
    }
  }

  private valid(r: ImportRow): boolean {
    return !r.fieldReason && !r.reason;
  }

  private report(importId: string, rows: ImportRow[]): ImportReport {
    const errors = rows
      .filter((r) => !this.valid(r))
      .map((r) => ({
        line: r.line,
        displayName: r.displayName,
        email: r.email,
        reason: (r.fieldReason || r.reason) ?? '',
      }));
    return {
      importId,
      total: rows.length,
      validCount: rows.length - errors.length,
      errorCount: errors.length,
      errors,
    };
  }
}
