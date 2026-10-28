import { Inject } from '@nestjs/common';
import { type Model, type PipelineStage, type UpdateQuery, Types } from 'mongoose';
import { AppError } from '../../errors.js';
import { WORKSPACE_PROVIDER, type WorkspaceProvider } from './workspace-provider.js';

export { notFound, orNotFound } from './not-found.js';

type Filter = Record<string, unknown>;
/** Update options that cannot widen the scope (e.g. `arrayFilters` for positional `$[name]` updates). */
type UpdateOptions = { arrayFilters?: Record<string, unknown>[] };

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  // Fail closed: never run a query without a valid workspace.
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(500, 'INTERNAL', 'Workspace context is missing or invalid');
  }
  return new Types.ObjectId(value);
}

/**
 * Thin workspace-bound repository (ADR-0006). Every filter, created document and aggregate pipeline
 * is forced to the given workspace; callers cannot override `workspaceId`.
 */
export function scoped<T>(model: Model<T>, workspace: string | Types.ObjectId) {
  const workspaceId = toObjectId(workspace);
  // Spread first so a caller-supplied workspaceId can never win.
  const only = (filter: Filter = {}) => ({ ...filter, workspaceId }) as never;

  return {
    workspaceId,
    find: (filter: Filter = {}) => model.find(only(filter)),
    findOne: (filter: Filter = {}) => model.findOne(only(filter)),
    /** Another workspace's id, or a malformed one, behaves exactly like a missing document. */
    findById: (id: string | Types.ObjectId) =>
      model.findOne(
        only(Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: { $in: [] } }),
      ),
    exists: (filter: Filter = {}) => model.exists(only(filter)),
    count: (filter: Filter = {}) => model.countDocuments(only(filter)),
    create: (doc: Filter) => model.create({ ...doc, workspaceId } as never),
    updateOne: (filter: Filter, update: UpdateQuery<T>, options?: UpdateOptions) =>
      model.updateOne(only(filter), update, options),
    updateMany: (filter: Filter, update: UpdateQuery<T>, options?: UpdateOptions) =>
      model.updateMany(only(filter), update, options),
    findOneAndUpdate: (
      filter: Filter,
      update: UpdateQuery<T>,
      options: { returnDocument?: 'after' | 'before' } = {},
    ) => model.findOneAndUpdate(only(filter), update, options),
    deleteOne: (filter: Filter) => model.deleteOne(only(filter)),
    deleteMany: (filter: Filter) => model.deleteMany(only(filter)),
    /** `$match` on the workspace is always the first stage; `$lookup`s must repeat the condition. */
    aggregate: (pipeline: PipelineStage[] = []) =>
      model.aggregate([{ $match: { workspaceId } }, ...pipeline]),
  };
}

export type ScopedRepository<T> = ReturnType<typeof scoped<T>>;

/** Base class for Nest providers: `this.scope` is bound to the current request's workspace. */
export abstract class WorkspaceScopedRepository<T> {
  constructor(
    protected readonly model: Model<T>,
    @Inject(WORKSPACE_PROVIDER) private readonly workspace: WorkspaceProvider,
  ) {}

  protected get scope(): ScopedRepository<T> {
    return scoped(this.model, this.workspace.workspaceId());
  }
}
