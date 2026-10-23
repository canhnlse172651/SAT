import mongoose, { type Connection } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type DevUserDoc,
  type DevWorkspaceDoc,
  DEV_USER_MODEL,
  DEV_WORKSPACE_MODEL,
  devUserSchema,
  devWorkspaceSchema,
} from '../directory/index.js';
import { withMongo } from '../../test/with-mongo.js';
import { SEED_GV_NAME, SEED_HV_NAMES, SEED_WORKSPACE_NAME, seedDev } from './seed.js';

const mongo = withMongo();
let conn: Connection;
beforeAll(async () => {
  conn = await mongoose.createConnection(mongo.uri('seed')).asPromise();
});
afterAll(async () => {
  await conn.close();
});

describe('seedDev', () => {
  it('[000:AC-seed] creates the workspace, one GV and three HV, and is idempotent', async () => {
    const workspaces = conn.model<DevWorkspaceDoc>(DEV_WORKSPACE_MODEL, devWorkspaceSchema);
    const users = conn.model<DevUserDoc>(DEV_USER_MODEL, devUserSchema);
    await Promise.all([workspaces.init(), users.init()]);

    const first = await seedDev(workspaces, users);
    const second = await seedDev(workspaces, users);

    expect(second).toEqual(first);
    expect(first.hvIds).toHaveLength(3);
    expect(await workspaces.find().lean()).toMatchObject([{ name: SEED_WORKSPACE_NAME }]);
    const all = await users.find().lean();
    expect(all).toHaveLength(4);
    expect(all.filter((u) => u.role === 'GV').map((u) => u.displayName)).toEqual([SEED_GV_NAME]);
    expect(
      all
        .filter((u) => u.role === 'HV')
        .map((u) => u.displayName)
        .sort(),
    ).toEqual([...SEED_HV_NAMES].sort());
    expect(JSON.stringify(all)).not.toMatch(/password|hash/i);
  });
});
