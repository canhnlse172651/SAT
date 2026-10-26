import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { STORAGE_QUOTA_BYTES, type Storage } from '@sat/shared';
import { type Connection, type Model, Types } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { JOB_SCHEDULER, type JobScheduler } from '../../common/ports/scheduler.js';
import { FILE_STORAGE, type FileStorage } from '../../common/ports/storage.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { logStep } from './steps.log.js';
import { LESSON_FILE_MODEL, type LessonFileDoc } from './steps.model.js';

const ORPHAN_AFTER_MS = 24 * 60 * 60_000;

/** Paths where a step stores file ids (block files and card files). */
const FILE_PATHS = [
  'items.content.blocks.file.id',
  'items.content.blocks.cards.image.id',
  'items.content.blocks.cards.audio.id',
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
