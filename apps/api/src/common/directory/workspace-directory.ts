import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Role } from '@sat/shared';
import { type Model, Schema, Types } from 'mongoose';

/*
 * FOUNDATION-ONLY. Users and workspaces belong to module 001, which does not exist yet. This port
 * lets `GET /api/session` show display names; the Mongo adapter reads `dev_workspaces` / `dev_users`,
 * which only the dev seed and `POST /api/dev/session` write. Module 001 replaces the adapter with
 * its real collections (bind `WORKSPACE_DIRECTORY` to a service over them) and drops the dev_* ones.
 */

export interface DirectoryUser {
  id: string;
  workspaceId: string;
  role: Role;
  displayName: string;
}

export interface DirectoryWorkspace {
  id: string;
  name: string;
}

export interface WorkspaceDirectory {
  findUser(userId: string, workspaceId: string): Promise<DirectoryUser | null>;
  findWorkspace(workspaceId: string): Promise<DirectoryWorkspace | null>;
}

export const WORKSPACE_DIRECTORY = Symbol('WORKSPACE_DIRECTORY');

export const DEV_WORKSPACE_MODEL = 'DevWorkspace';
export const DEV_USER_MODEL = 'DevUser';

export interface DevWorkspaceDoc {
  name: string;
}
export interface DevUserDoc {
  workspaceId: Types.ObjectId;
  role: Role;
  displayName: string;
}

export const devWorkspaceSchema = new Schema<DevWorkspaceDoc>(
  { name: { type: String, required: true } },
  { collection: 'dev_workspaces', timestamps: true },
);
devWorkspaceSchema.index({ name: 1 }, { unique: true });

export const devUserSchema = new Schema<DevUserDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['GV', 'HV'], required: true },
    displayName: { type: String, required: true },
  },
  { collection: 'dev_users', timestamps: true },
);
devUserSchema.index({ workspaceId: 1, role: 1, displayName: 1 }, { unique: true });

const isId = (id: string): boolean => Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);

@Injectable()
export class DevWorkspaceDirectory implements WorkspaceDirectory {
  constructor(
    @InjectModel(DEV_WORKSPACE_MODEL) private readonly workspaces: Model<DevWorkspaceDoc>,
    @InjectModel(DEV_USER_MODEL) private readonly users: Model<DevUserDoc>,
  ) {}

  async findUser(userId: string, workspaceId: string): Promise<DirectoryUser | null> {
    if (!isId(userId) || !isId(workspaceId)) return null;
    const doc = await this.users.findOne({ _id: userId, workspaceId }).lean();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      workspaceId: doc.workspaceId.toString(),
      role: doc.role,
      displayName: doc.displayName,
    };
  }

  async findWorkspace(workspaceId: string): Promise<DirectoryWorkspace | null> {
    if (!isId(workspaceId)) return null;
    const doc = await this.workspaces.findById(workspaceId).lean();
    return doc ? { id: doc._id.toString(), name: doc.name } : null;
  }
}
