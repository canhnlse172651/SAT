import type { INestApplicationContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Role } from '@sat/shared';
import type { Model } from 'mongoose';
import {
  DEV_USER_MODEL,
  DEV_WORKSPACE_MODEL,
  type DevUserDoc,
  type DevWorkspaceDoc,
} from '../common/directory/workspace-directory.js';

export interface MadeWorkspace {
  id: string;
  name: string;
}
export interface MadeUser {
  id: string;
  role: Role;
  workspaceId: string;
  displayName: string;
}

let sequence = 0;
const next = () => ++sequence;

const workspaces = (app: INestApplicationContext) =>
  app.get<Model<DevWorkspaceDoc>>(getModelToken(DEV_WORKSPACE_MODEL), { strict: false });
const users = (app: INestApplicationContext) =>
  app.get<Model<DevUserDoc>>(getModelToken(DEV_USER_MODEL), { strict: false });

/**
 * Factories write the foundation-only `dev_workspaces` / `dev_users` collections. Module 001 repoints
 * them at its real workspace and user collections so tests keep calling the same functions.
 */
export async function makeWorkspace(
  app: INestApplicationContext,
  overrides: { name?: string } = {},
): Promise<MadeWorkspace> {
  const doc = await workspaces(app).create({ name: overrides.name ?? `Workspace ${next()}` });
  return { id: doc._id.toString(), name: doc.name };
}

async function makeUser(
  app: INestApplicationContext,
  role: Role,
  overrides: { workspaceId?: string; displayName?: string },
): Promise<MadeUser> {
  const workspaceId = overrides.workspaceId ?? (await makeWorkspace(app)).id;
  const displayName =
    overrides.displayName ?? `${role === 'GV' ? 'Giáo viên' : 'Học viên'} ${next()}`;
  const doc = await users(app).create({ workspaceId, role, displayName });
  return { id: doc._id.toString(), role, workspaceId, displayName };
}

/** A teacher; creates a fresh workspace unless `workspaceId` is given. */
export const makeGv = (
  app: INestApplicationContext,
  overrides: { workspaceId?: string; displayName?: string } = {},
) => makeUser(app, 'GV', overrides);

/** A student; creates a fresh workspace unless `workspaceId` is given. */
export const makeHv = (
  app: INestApplicationContext,
  overrides: { workspaceId?: string; displayName?: string } = {},
) => makeUser(app, 'HV', overrides);
