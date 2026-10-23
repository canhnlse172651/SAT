import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { foldSearch, type StudentStatus } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { scoped } from '../../common/tenancy/scoped.js';
import { USER_MODEL, type UserDoc } from './accounts.model.js';

export interface StudentInfo {
  id: string;
  displayName: string;
  email: string;
  status: StudentStatus;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const info = (u: Pick<UserDoc, '_id' | 'displayName' | 'email' | 'status'>): StudentInfo => ({
  id: String(u._id),
  displayName: u.displayName,
  email: u.email,
  status: u.status,
});

/**
 * Read-only view of a workspace's students for other modules (003 Lớp học: pickers, members, reminder e-mails).
 * Names sort A→Z with Vietnamese collation; search folds case and diacritics over name and e-mail (001 AC-11.3).
 */
@Injectable()
export class StudentDirectory {
  constructor(@InjectModel(USER_MODEL) private readonly users: Model<UserDoc>) {}

  async search(
    workspaceId: string,
    query: { q?: string | undefined; page: number; limit: number },
  ): Promise<{ items: StudentInfo[]; total: number; workspaceTotal: number }> {
    const scope = scoped(this.users, workspaceId);
    const q = foldSearch(query.q ?? '');
    const filter = { role: 'HV', ...(q ? { searchKey: { $regex: escapeRegex(q) } } : {}) };
    const [total, workspaceTotal, docs] = await Promise.all([
      scope.count(filter),
      scope.count({ role: 'HV' }),
      scope
        .find(filter)
        .collation({ locale: 'vi' })
        .sort({ displayName: 1, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .select({ displayName: 1, email: 1, status: 1 })
        .lean<UserDoc[]>(),
    ]);
    return { items: docs.map(info), total, workspaceTotal };
  }

  /** The students among `ids` that still exist in the workspace. */
  async byIds(workspaceId: string, ids: readonly string[]): Promise<StudentInfo[]> {
    const valid = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!valid.length) return [];
    const docs = await scoped(this.users, workspaceId)
      .find({ role: 'HV', _id: { $in: valid } })
      .select({ displayName: 1, email: 1, status: 1 })
      .lean<UserDoc[]>();
    return docs.map(info);
  }

  /**
   * Whether any of `ids` is a user of another workspace (003 AC-14.6: such a reference is answered like a missing
   * page, not like a deleted student). Existence only — nothing of the other workspace is read.
   */
  async anyElsewhere(workspaceId: string, ids: readonly string[]): Promise<boolean> {
    const valid = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!valid.length) return false;
    return !!(await this.users.exists({
      _id: { $in: valid },
      workspaceId: { $ne: new Types.ObjectId(workspaceId) },
    }));
  }
}
