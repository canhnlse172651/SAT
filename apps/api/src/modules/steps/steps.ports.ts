import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { type Connection, Types } from 'mongoose';

/*
 * What 004 needs from 005 (not built yet): the "Bước học liên kết" of exercise sets (AC-10.1 – AC-10.3, AC-8.1, AC-9.5).
 * 005 re-binds `STEP_PRACTICE` when it ships; until then `DevStepPractice` reads `dev_step_links`, written only by the
 * dev endpoint (empty in production).
 */
export interface StepPractice {
  /** Linked set ids per step id (steps without links are absent). */
  setsOf(workspaceId: string, stepIds: readonly string[]): Promise<Map<string, string[]>>;
  /** The steps are gone: their sets become unlinked (the sets themselves stay). */
  unlink(workspaceId: string, stepIds: readonly string[]): Promise<void>;
}

export const STEP_PRACTICE = Symbol('STEP_PRACTICE');
export const DEV_STEP_LINKS_COLLECTION = 'dev_step_links';

export interface DevStepLinkDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  setId: Types.ObjectId;
  stepId: Types.ObjectId;
}

const oids = (ids: readonly string[]) =>
  ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

/** Raw collection access: every row carries and is filtered by `workspaceId`. */
@Injectable()
export class DevStepPractice implements StepPractice {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  get rows() {
    return this.connection.collection<DevStepLinkDoc>(DEV_STEP_LINKS_COLLECTION);
  }

  async setsOf(workspaceId: string, stepIds: readonly string[]) {
    const out = new Map<string, string[]>();
    if (!stepIds.length) return out;
    const rows = await this.rows
      .find({ workspaceId: new Types.ObjectId(workspaceId), stepId: { $in: oids(stepIds) } })
      .toArray();
    for (const r of rows) {
      const key = String(r.stepId);
      out.set(key, [...(out.get(key) ?? []), String(r.setId)]);
    }
    return out;
  }

  async unlink(workspaceId: string, stepIds: readonly string[]) {
    if (!stepIds.length) return;
    await this.rows.deleteMany({
      workspaceId: new Types.ObjectId(workspaceId),
      stepId: { $in: oids(stepIds) },
    });
  }

  /** Dev: one link per set (a set links at most one step); null removes it. */
  async link(workspaceId: string, setId: string, stepId: string | null) {
    const key = { workspaceId: new Types.ObjectId(workspaceId), setId: new Types.ObjectId(setId) };
    if (!stepId) {
      await this.rows.deleteOne(key);
      return;
    }
    await this.rows.updateOne(
      key,
      { $set: { stepId: new Types.ObjectId(stepId) } },
      { upsert: true },
    );
  }
}
