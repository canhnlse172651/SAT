import mongoose, { type Connection } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { verifyPassword } from './common/auth/password.js';
import {
  USER_MODEL,
  type UserDoc,
  WORKSPACE_MODEL,
  type WorkspaceDoc,
  userSchema,
  workspaceSchema,
} from './modules/accounts/accounts.model.js';
import {
  SEED_GV,
  SEED_HV_PASSWORD,
  SEED_HVS,
  SEED_WORKSPACE_NAME,
  seedAccounts,
} from './modules/accounts/accounts.seed.js';
import { withMongo } from './test/with-mongo.js';

const mongo = withMongo();
let conn: Connection;
beforeAll(async () => {
  conn = await mongoose.createConnection(mongo.uri('seed')).asPromise();
});
afterAll(async () => {
  await conn.close();
});

describe('seedAccounts', () => {
  it('[000:AC-seed] creates the workspace, one GV and three active HV with dev passwords, idempotently', async () => {
    const workspaces = conn.model<WorkspaceDoc>(WORKSPACE_MODEL, workspaceSchema);
    const users = conn.model<UserDoc>(USER_MODEL, userSchema);
    await Promise.all([workspaces.init(), users.init()]);

    const first = await seedAccounts({ users, workspaces });
    const second = await seedAccounts({ users, workspaces });

    expect(second).toEqual(first);
    expect(first.hvIds).toHaveLength(3);
    const [ws] = await workspaces.find().lean();
    expect(ws).toMatchObject({ name: SEED_WORKSPACE_NAME });
    expect(ws?.ownerId.toString()).toBe(first.gvId);
    const all = await users.find().lean();
    expect(all).toHaveLength(4);
    const gv = all.find((u) => u.role === 'GV');
    expect(gv).toMatchObject({ email: SEED_GV.email, status: 'active' });
    expect(await verifyPassword(SEED_GV.password, gv?.passwordHash ?? '')).toBe(true);
    const hvs = all.filter((u) => u.role === 'HV');
    expect(hvs.map((u) => u.email).sort()).toEqual(SEED_HVS.map((h) => h.email).sort());
    expect(hvs.every((u) => u.status === 'active')).toBe(true);
    expect(await verifyPassword(SEED_HV_PASSWORD, hvs[0]?.passwordHash ?? '')).toBe(true);
  });
});
