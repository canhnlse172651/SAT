import { Readable, Transform } from 'node:stream';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  FILE_RULES,
  type FileKind,
  type FileRef,
  STEP_ERROR_CODES as E,
  STORAGE_QUOTA_BYTES,
  type Storage,
  contentTypeFor,
  corruptFileMessage,
  fileExtension,
  STEP_MESSAGES as SM,
  storageFullMessage,
  tooLargeMessage,
  unsupportedFormatMessage,
} from '@sat/shared';
import { type Connection, type Model, Types } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { JOB_SCHEDULER, type JobScheduler } from '../../common/ports/scheduler.js';
import { FILE_STORAGE, type FileStorage } from '../../common/ports/storage.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { UnprocessableFileError, checkPdf, docxPages, pptxPages, sniffMatches } from './sniff.js';
import { logStep } from './steps.log.js';
import { LESSON_FILE_MODEL, type LessonFileDoc } from './steps.model.js';

const ORPHAN_AFTER_MS = 24 * 60 * 60_000;

/** Paths where a step (block and card files) or a set (005: question and option images) stores file ids. */
const FILE_PATHS = [
  'items.content.blocks.file.id',
  'items.content.blocks.cards.image.id',
  'items.content.blocks.cards.audio.id',
  'items.content.questions.image.id',
  'items.content.questions.options.image.id',
  'items.content.questions.subs.image.id',
  'items.content.questions.subs.options.image.id',
];

/**
 * Workspace storage (AC-5.5): every registered file counts once by its size. Block and card files are released (bytes
 * and registry row) as soon as no step of the workspace references them any more; uploads never saved into a step are
 * swept after 24 h (daily 03:00 VN).
 */
@Injectable()
export class StepFilesService implements OnModuleInit {
  constructor(
    @InjectModel(LESSON_FILE_MODEL) private readonly files: Model<LessonFileDoc>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(FILE_STORAGE) private readonly store: FileStorage,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(JOB_SCHEDULER) private readonly jobs: JobScheduler,
  ) {}

  onModuleInit(): void {
    this.jobs.every('steps-orphan-files', '03:00', () => this.sweepAll());
  }

  /** Lessons of the workspace (002's collection; read only — raw access is limited to reference checks). */
  private get lessons() {
    return this.connection.collection('lessons');
  }

  async usedBytes(workspaceId: string, beforeId?: Types.ObjectId): Promise<number> {
    const match: Record<string, unknown> = { workspaceId: new Types.ObjectId(workspaceId) };
    if (beforeId) match['_id'] = { $lt: beforeId };
    const [row] = await this.files
      .aggregate<{ total: number }>([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$size' } } },
      ])
      .exec();
    return row?.total ?? 0;
  }

  async usage(workspaceId: string): Promise<Storage> {
    return { usedBytes: await this.usedBytes(workspaceId), quotaBytes: STORAGE_QUOTA_BYTES };
  }

  /** The registered file of the workspace, or null (another workspace's / unknown id). */
  find(workspaceId: string, fileId: string): Promise<LessonFileDoc | null> {
    return scoped(this.files, workspaceId).findOne({ fileId }).lean<LessonFileDoc>().exec();
  }

  private async referenced(workspaceId: string, fileId: string): Promise<boolean> {
    const hit = await this.lessons.findOne(
      {
        workspaceId: new Types.ObjectId(workspaceId),
        $or: FILE_PATHS.map((path) => ({ [path]: fileId })),
      },
      { projection: { _id: 1 } },
    );
    return !!hit;
  }

  /** Deletes the bytes and the registry row of each block / card file no step references any more. */
  async release(workspaceId: string, fileIds: Iterable<string>): Promise<number> {
    let released = 0;
    for (const fileId of new Set(fileIds)) {
      const row = await this.find(workspaceId, fileId);
      if (!row || (row.kind !== 'block' && row.kind !== 'card')) continue;
      if (await this.referenced(workspaceId, fileId)) continue;
      await this.store.delete(fileId).catch(() => undefined);
      await scoped(this.files, workspaceId).deleteOne({ _id: row._id });
      released++;
    }
    if (released) logStep({ action: 'file.release', workspaceId, count: released });
    return released;
  }

  /** Uploads older than 24 h that never made it into a saved step. */
  async sweep(workspaceId: string): Promise<number> {
    const cutoff = new Date(this.clock.now().getTime() - ORPHAN_AFTER_MS);
    const rows = await scoped(this.files, workspaceId)
      .find({ kind: { $in: ['block', 'card'] }, createdAt: { $lt: cutoff } })
      .lean<Pick<LessonFileDoc, 'fileId'>[]>();
    return this.release(
      workspaceId,
      rows.map((r) => r.fileId),
    );
  }

  private async sweepAll(): Promise<void> {
    const workspaces = await this.files.distinct('workspaceId');
    for (const ws of workspaces) await this.sweep(String(ws));
  }

  /**
   * REQ-5 / REQ-6: one upload (the request stream). Refused before reading when the format, the declared size or the
   * storage forbids it; after storing when the bytes do not match the format (AC-5.4), the document cannot be read
   * (AC-6.6) or a parallel upload used the remaining storage first (AC-5.6, §8). A cancelled upload stores nothing.
   */
  async upload(
    workspaceId: string,
    ownerId: string,
    kind: FileKind,
    rawName: string,
    declared: number,
    body: Readable,
  ): Promise<FileRef> {
    // Path separators out; control characters are refused by the storage port's filename check.
    const name = rawName.replace(/[\\/]/g, '_').trim().slice(0, 255) || 'tep';
    const contentType = contentTypeFor(kind, name);
    const refuse = (status: number, code: string, message: string) => {
      body.resume();
      logStep({ action: 'file.upload', result: 'denied', workspaceId, kind, code });
      return new AppError(status, code, message);
    };
    if (!contentType) throw refuse(415, E.UNSUPPORTED_FORMAT, unsupportedFormatMessage(kind));
    const max = FILE_RULES[kind].maxBytes;
    if (declared > max) throw refuse(413, E.FILE_TOO_LARGE, tooLargeMessage(kind, name, declared));
    const used = await this.usedBytes(workspaceId);
    if (used + declared > STORAGE_QUOTA_BYTES)
      throw refuse(409, E.STORAGE_FULL, storageFullMessage(STORAGE_QUOTA_BYTES - used));

    let seen = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _enc, done) {
        seen += chunk.length;
        if (seen > max)
          done(new AppError(413, E.FILE_TOO_LARGE, tooLargeMessage(kind, name, seen)));
        else done(null, chunk);
      },
    });
    body.on('error', (err) => limit.destroy(err));
    let stored: { id: string; size: number };
    try {
      stored = await this.store.put({
        workspaceId,
        ownerId,
        filename: name,
        contentType,
        stream: body.pipe(limit),
      });
    } catch (err) {
      logStep({
        action: 'file.upload',
        result: 'failed',
        workspaceId,
        kind,
        code: 'UPLOAD_FAILED',
      });
      throw err instanceof AppError ? err : new AppError(400, 'UPLOAD_FAILED', 'Tải lên thất bại');
    }
    const fail = async (status: number, code: string, message: string) => {
      await this.store.delete(stored.id).catch(() => undefined);
      logStep({ action: 'file.upload', result: 'failed', workspaceId, kind, code });
      return new AppError(status, code, message);
    };

    const ext = fileExtension(name);
    const bytes = await this.read(stored.id, ext === 'pdf' || ext === 'docx' || ext === 'pptx');
    if (!stored.size || !sniffMatches(ext, bytes))
      throw await fail(422, E.CORRUPT_FILE, corruptFileMessage(kind));
    let preview: string[][] | null = null;
    try {
      if (ext === 'docx') preview = docxPages(bytes);
      else if (ext === 'pptx') preview = pptxPages(bytes);
      else if (ext === 'pdf') checkPdf(bytes);
    } catch (err) {
      if (err instanceof UnprocessableFileError)
        throw await fail(422, E.PROCESS_FAILED, SM.processFailed);
      throw err;
    }

    const row = await scoped(this.files, workspaceId).create({
      fileId: stored.id,
      kind: kind === 'cardImage' || kind === 'cardAudio' ? 'card' : 'block',
      size: stored.size,
      name,
      contentType,
      ownerId,
      preview,
    });
    // A parallel upload finished first and took the remaining storage (§8): this one is refused.
    const before = await this.usedBytes(workspaceId, row._id);
    if (before + stored.size > STORAGE_QUOTA_BYTES) {
      await scoped(this.files, workspaceId).deleteOne({ _id: row._id });
      throw await fail(409, E.STORAGE_FULL, storageFullMessage(STORAGE_QUOTA_BYTES - before));
    }
    logStep({ action: 'file.upload', workspaceId, kind, size: stored.size });
    return {
      id: stored.id,
      name,
      size: stored.size,
      contentType,
      pages: preview ? preview.length : null,
    };
  }

  /** The stored bytes: all of them (documents) or the first 64 KB (magic bytes). */
  private async read(fileId: string, all: boolean): Promise<Uint8Array> {
    const found = await this.store.get(fileId);
    if (!found) return new Uint8Array();
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of found.stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      chunks.push(buf);
      size += buf.length;
      if (!all && size >= 64 * 1024) {
        found.stream.destroy();
        break;
      }
    }
    return new Uint8Array(Buffer.concat(chunks));
  }

  /** The text pages of a DOCX / PPTX of the workspace (AC-14.5), or null. */
  async preview(workspaceId: string, fileId: string): Promise<string[][] | null> {
    return (await this.find(workspaceId, fileId))?.preview ?? null;
  }

  /** Dev/test: the filler that stands for already used storage (AC-5.5 – AC-5.7 without uploading gigabytes). */
  async setFiller(workspaceId: string, ownerId: string, usedBytes: number): Promise<void> {
    await scoped(this.files, workspaceId).deleteMany({ kind: 'filler' });
    if (usedBytes <= 0) return;
    await scoped(this.files, workspaceId).create({
      fileId: `filler-${workspaceId}`,
      kind: 'filler',
      size: usedBytes,
      name: 'filler',
      contentType: 'application/octet-stream',
      ownerId,
      preview: null,
    });
  }
}
