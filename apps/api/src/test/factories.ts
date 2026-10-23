import type { INestApplicationContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Role } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { hashPassword } from '../common/auth/password.js';
import {
  USER_MODEL,
  type UserDoc,
  WORKSPACE_MODEL,
  type WorkspaceDoc,
  searchKeyFor,
} from '../modules/accounts/accounts.model.js';

export interface MadeWorkspace {
  id: string;
  name: string;
}
export interface MadeUser {
  id: string;
  role: Role;
  workspaceId: string;
  displayName: string;
  email: string;
}

let sequence = 0;
const next = () => ++sequence;
const run = Math.random().toString(36).slice(2, 8);

const workspaces = (app: INestApplicationContext) =>
  app.get<Model<WorkspaceDoc>>(getModelToken(WORKSPACE_MODEL), { strict: false });
const users = (app: INestApplicationContext) =>
  app.get<Model<UserDoc>>(getModelToken(USER_MODEL), { strict: false });

/** Factories write the real accounts collections of module 001 (users, workspaces). */
export async function makeWorkspace(
  app: INestApplicationContext,
  overrides: { name?: string } = {},
): Promise<MadeWorkspace> {
  // Owner is a placeholder until makeGv creates the teacher of this workspace.
  const doc = await workspaces(app).create({
    name: overrides.name ?? `Workspace ${next()}`,
    ownerId: new Types.ObjectId(),
  });
  return { id: doc._id.toString(), name: doc.name };
}

export interface UserOverrides {
  workspaceId?: string;
  displayName?: string;
  email?: string;
  /** Plain password to hash (default: none — sign in through `loginAs`). */
  password?: string;
  status?: UserDoc['status'];
}

async function makeUser(
  app: INestApplicationContext,
  role: Role,
  overrides: UserOverrides,
): Promise<MadeUser> {
  const workspaceId = overrides.workspaceId ?? (await makeWorkspace(app)).id;
  const n = next();
  const displayName = overrides.displayName ?? `${role === 'GV' ? 'Giáo viên' : 'Học viên'} ${n}`;
  const email = (overrides.email ?? `user-${run}-${n}@test.sat`).toLowerCase();
  const doc = await users(app).create({
    workspaceId,
    role,
    displayName,
    email,
    emailKey: email,
    searchKey: searchKeyFor(displayName, email),
    status: overrides.status ?? 'active',
    ...(overrides.password ? { passwordHash: await hashPassword(overrides.password) } : {}),
    ...(role === 'HV' ? { passwordSource: 'system' } : {}),
  });
  if (role === 'GV') await workspaces(app).updateOne({ _id: workspaceId }, { ownerId: doc._id });
  return { id: doc._id.toString(), role, workspaceId, displayName, email };
}

/** A teacher; creates a fresh workspace unless `workspaceId` is given. */
export const makeGv = (app: INestApplicationContext, overrides: UserOverrides = {}) =>
  makeUser(app, 'GV', overrides);

/** A student (active unless `status` is given); creates a fresh workspace unless `workspaceId` is given. */
export const makeHv = (app: INestApplicationContext, overrides: UserOverrides = {}) =>
  makeUser(app, 'HV', overrides);
