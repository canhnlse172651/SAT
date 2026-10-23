import { type Model, Types } from 'mongoose';
import { hashPassword } from '../../common/auth/password.js';
import {
  type UserDoc,
  type WorkspaceDoc,
  searchKeyFor,
  workspaceNameFor,
} from './accounts.model.js';

/* Development data (`npm run seed -w @sat/api`, the hermetic e2e server). Never used in production. */

export const SEED_GV = {
  displayName: 'Cô Lan',
  email: 'lan@sat.dev',
  password: 'LanHSK2026',
} as const;
export const SEED_HV_PASSWORD = 'HocVien2026';
export const SEED_HVS = [
  { displayName: 'Học viên Một', email: 'hv1@sat.dev' },
  { displayName: 'Học viên Hai', email: 'hv2@sat.dev' },
  { displayName: 'Học viên Ba', email: 'hv3@sat.dev' },
] as const;
export const SEED_WORKSPACE_NAME = workspaceNameFor(SEED_GV.displayName);

export interface SeedResult {
  workspaceId: string;
  gvId: string;
  hvIds: string[];
}

/** Idempotent: re-running finds the existing documents (and leaves passwords changed since untouched). */
export async function seedAccounts(models: {
  users: Model<UserDoc>;
  workspaces: Model<WorkspaceDoc>;
}): Promise<SeedResult> {
  const { users, workspaces } = models;
  const upsert = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true } as const;
  const gvHash = await hashPassword(SEED_GV.password);
  const hvHash = await hashPassword(SEED_HV_PASSWORD);

  const existing = await users.findOne({ emailKey: SEED_GV.email }).lean();
  const existingWs = existing ? await workspaces.exists({ _id: existing.workspaceId }) : null;
  // The owner id is fixed right below, once the GV exists.
  const workspaceId: Types.ObjectId =
    existing && existingWs
      ? existing.workspaceId
      : (await workspaces.create({ name: SEED_WORKSPACE_NAME, ownerId: new Types.ObjectId() }))._id;
  const gv = await users.findOneAndUpdate(
    { emailKey: SEED_GV.email },
    {
      $setOnInsert: {
        workspaceId: workspaceId,
        role: 'GV',
        displayName: SEED_GV.displayName,
        email: SEED_GV.email,
        emailKey: SEED_GV.email,
        searchKey: searchKeyFor(SEED_GV.displayName, SEED_GV.email),
        status: 'active',
        passwordHash: gvHash,
      },
    },
    upsert,
  );
  await workspaces.updateOne({ _id: workspaceId }, { ownerId: gv._id });

  const hvIds: string[] = [];
  for (const hv of SEED_HVS) {
    const doc = await users.findOneAndUpdate(
      { emailKey: hv.email },
      {
        $setOnInsert: {
          workspaceId: workspaceId,
          role: 'HV',
          displayName: hv.displayName,
          email: hv.email,
          emailKey: hv.email,
          searchKey: searchKeyFor(hv.displayName, hv.email),
          status: 'active',
          passwordHash: hvHash,
          passwordSource: 'system',
          activatedAt: new Date(),
        },
      },
      upsert,
    );
    hvIds.push(doc._id.toString());
  }
  return { workspaceId: workspaceId.toString(), gvId: gv._id.toString(), hvIds };
}
