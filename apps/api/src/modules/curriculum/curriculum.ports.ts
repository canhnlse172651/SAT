import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { AiLabel, UsingClass } from '@sat/shared';
import { type Connection, Types } from 'mongoose';
import type { ItemDoc } from './curriculum.model.js';

/*
 * What 002 needs from modules that do not exist yet. Each module re-binds its token when it ships:
 * - 003 Lớp học: classes using a curriculum (AC-3.1, AC-4.3, AC-4.4, AC-13.2) and the curricula an HV studies (AC-10.1);
 * - 005 Bài tập: which exercise sets have learning data — attempts or submissions (AC-12.3, AC-12.5, AC-13.3, AC-19.3);
 * - 010 Tạo bài bằng AI: the AI label of a Bài (AC-11.3) and discarding unapproved content (AC-12.7, AC-13.1).
 */

export interface CurriculumClasses {
  /** Using classes per curriculum id, in any status (M-4). */
  usage(workspaceId: string, curriculumIds: readonly string[]): Promise<Map<string, UsingClass[]>>;
  /** Curricula used by the classes the student is in. */
  curriculaOfStudent(workspaceId: string, studentId: string): Promise<string[]>;
}

export interface LearningData {
  /** The subset of `itemIds` (exercise sets) that have at least one attempt or submission. */
  setsWithData(workspaceId: string, itemIds: readonly string[]): Promise<Set<string>>;
}

export interface AiDrafts {
  labels(workspaceId: string, lessonIds: readonly string[]): Promise<Map<string, AiLabel>>;
  discard(workspaceId: string, lessonIds: readonly string[]): Promise<void>;
}

export const CURRICULUM_CLASSES = Symbol('CURRICULUM_CLASSES');
export const LEARNING_DATA = Symbol('LEARNING_DATA');
export const AI_DRAFTS = Symbol('AI_DRAFTS');

export const DEV_LINKS_COLLECTION = 'dev_curriculum_links';

/** One stand-in row: a using class, a set with learning data or a Bài AI label (written by the dev endpoints). */
export interface DevLinkDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  kind: 'class' | 'learning' | 'ai';
  curriculumId?: Types.ObjectId;
  name?: string;
  status?: UsingClass['status'];
  startDate?: string;
  studentIds?: Types.ObjectId[];
  itemId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  state?: AiLabel['state'];
  percent?: number;
}

const oids = (ids: readonly string[]) =>
  ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

export const aiLabelText = (state: AiLabel['state'], percent?: number): string =>
  state === 'review'
    ? 'AI · Chờ duyệt'
    : `AI · Đang tạo${percent === undefined ? '' : ` ${percent}%`}`;

/**
 * Dev/test stand-in for 003, 005 and 010, reading `dev_curriculum_links` (raw collection: rows always carry and are
 * filtered by `workspaceId`). Nothing writes it in production, so there it answers "no classes, no data, no AI".
 */
@Injectable()
export class DevCurriculumLinks implements CurriculumClasses, LearningData, AiDrafts {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private get rows() {
    return this.connection.collection<DevLinkDoc>(DEV_LINKS_COLLECTION);
  }

  async usage(workspaceId: string, curriculumIds: readonly string[]) {
    const out = new Map<string, UsingClass[]>(curriculumIds.map((id) => [id, []]));
    const rows = await this.rows
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        kind: 'class',
        curriculumId: { $in: oids(curriculumIds) },
      })
      .sort({ startDate: 1, _id: 1 })
      .toArray();
    for (const r of rows) {
      out.get(String(r.curriculumId))?.push({
        id: String(r._id),
        name: r.name ?? '',
        status: r.status ?? 'active',
        startDate: r.startDate ?? '',
      });
    }
    return out;
  }

  async curriculaOfStudent(workspaceId: string, studentId: string) {
    const rows = await this.rows
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        kind: 'class',
        studentIds: new Types.ObjectId(studentId),
      })
      .toArray();
    return [...new Set(rows.map((r) => String(r.curriculumId)))];
  }

  async setsWithData(workspaceId: string, itemIds: readonly string[]) {
    if (!itemIds.length) return new Set<string>();
    const rows = await this.rows
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        kind: 'learning',
        itemId: { $in: oids(itemIds) },
      })
      .toArray();
    return new Set(rows.map((r) => String(r.itemId)));
  }

  async labels(workspaceId: string, lessonIds: readonly string[]) {
    const rows = await this.rows
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        kind: 'ai',
        lessonId: { $in: oids(lessonIds) },
      })
      .toArray();
    return new Map(
      rows
        .filter((r) => r.state)
        .map((r) => [
          String(r.lessonId),
          { state: r.state!, label: aiLabelText(r.state!, r.percent) } satisfies AiLabel,
        ]),
    );
  }

  async discard(workspaceId: string, lessonIds: readonly string[]) {
    await this.rows.deleteMany({
      workspaceId: new Types.ObjectId(workspaceId),
      kind: 'ai',
      lessonId: { $in: oids(lessonIds) },
    });
  }
}

/** Dev-only fault injection for "duplicate failed / still running" (AC-14.5, AC-15.5, AC-15.6). */
export type FaultOp = 'duplicate-lesson' | 'duplicate-curriculum';

@Injectable()
export class CurriculumFaults {
  private readonly next = new Map<FaultOp, { fail: boolean; delayMs: number }>();

  set(op: FaultOp, fault: { fail: boolean; delayMs: number }): void {
    this.next.set(op, fault);
  }

  /** Applies (once) the fault set for `op`: waits, then throws if asked to fail. */
  async apply(op: FaultOp): Promise<void> {
    const fault = this.next.get(op);
    if (!fault) return;
    this.next.delete(op);
    if (fault.delayMs) await new Promise((r) => setTimeout(r, fault.delayMs));
    if (fault.fail) throw new Error(`injected ${op} failure`);
  }
}

/**
 * 004 (step content) reacts to step changes made through 002's item lifecycle and supplies the facts the AI approval
 * confirmation of the Bài học section needs (004 AC-19.1). Bound by `StepsModule` (global); absent in tests without it.
 */
export interface StepHooks {
  /**
   * Before a step's content is stored: rich text sanitised, file references checked against the workspace's registered
   * files (and their metadata taken from there). Throws an `AppError` for a foreign or unknown file.
   */
  prepare(workspaceId: string, content: unknown): Promise<unknown>;
  /** A step's content was saved (files no longer used are released, marks of removed cards dropped). */
  saved(workspaceId: string, before: ItemDoc, after: ItemDoc): Promise<void>;
  /** Steps were deleted or replaced: their marks, files and practice links go (AC-8.1, AC-9.5). */
  removed(workspaceId: string, items: readonly ItemDoc[]): Promise<void>;
  /** Classes not ended that use the curriculum and show the Bài học section of the Bài (AC-7.4). */
  audience(workspaceId: string, curriculumId: string, lessonId: string): Promise<number>;
  /** Exercise sets linked to any of the steps (005). */
  linkedSets(workspaceId: string, stepIds: readonly string[]): Promise<number>;
}

export const STEP_HOOKS = Symbol('STEP_HOOKS');

/**
 * 005 (set content) checks and reacts to set changes made through 002's item lifecycle. Bound by `ExercisesModule`
 * (global); absent in tests without it.
 */
export interface SetHooks {
  /**
   * Before a set's content is stored: parsed into the 005 shape, image references checked against the workspace's
   * registered files. Throws an `AppError` for an invalid field (AC-12.14), a foreign / unknown file or a structure
   * change of a set with submissions (005 AC-18.1, against `before`), or a change of scores the GV did not confirm
   * (005 AC-19.2, `confirmRegrade`).
   */
  prepare(
    workspaceId: string,
    title: string,
    content: unknown,
    before?: ItemDoc,
    confirmRegrade?: boolean,
  ): Promise<unknown>;
  /** Submissions of each set (all classes) by item id — the AI replace confirmation (005 AC-13.11). */
  submissionCounts(workspaceId: string, itemIds: readonly string[]): Promise<Map<string, number>>;
  /** A set's content was saved (images no longer used are released — AC-3.5). */
  saved(workspaceId: string, before: ItemDoc, after: ItemDoc): Promise<void>;
  /** Sets were deleted or replaced: their images are released when no longer used (AC-22.1, AC-13.9). */
  removed(workspaceId: string, items: readonly ItemDoc[]): Promise<void>;
}

export const SET_HOOKS = Symbol('SET_HOOKS');
