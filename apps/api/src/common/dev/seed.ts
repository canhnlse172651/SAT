import type { Model } from 'mongoose';
import type { DevUserDoc, DevWorkspaceDoc } from '../directory/workspace-directory.js';

export const SEED_WORKSPACE_NAME = 'Workspace của Cô Lan';
export const SEED_GV_NAME = 'Cô Lan';
export const SEED_HV_NAMES = ['Học viên Một', 'Học viên Hai', 'Học viên Ba'] as const;

export interface SeedResult {
  workspaceId: string;
  gvId: string;
  hvIds: string[];
}

/** Idempotent: re-running finds the existing documents. No passwords exist; sessions come from `POST /api/dev/session`. */
export async function seedDev(
  workspaces: Model<DevWorkspaceDoc>,
  users: Model<DevUserDoc>,
): Promise<SeedResult> {
  const upsert = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true } as const;
  const workspace = await workspaces.findOneAndUpdate(
    { name: SEED_WORKSPACE_NAME },
    { $setOnInsert: { name: SEED_WORKSPACE_NAME } },
    upsert,
  );
  const user = async (role: 'GV' | 'HV', displayName: string): Promise<string> => {
    const doc = await users.findOneAndUpdate(
      { workspaceId: workspace._id, role, displayName },
      { $setOnInsert: { workspaceId: workspace._id, role, displayName } },
      upsert,
    );
    return doc._id.toString();
  };
  const gvId = await user('GV', SEED_GV_NAME);
  const hvIds: string[] = [];
  for (const name of SEED_HV_NAMES) hvIds.push(await user('HV', name));
  return { workspaceId: workspace._id.toString(), gvId, hvIds };
}
