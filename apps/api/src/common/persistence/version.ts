import { AppError } from '../../errors.js';
import { notFound } from '../tenancy/not-found.js';

interface Versioned {
  version: number;
  updatedAt?: Date;
}

/** The slice of a Mongoose model / `scoped()` repository this helper needs. */
export interface VersionedStore<T extends Versioned> {
  findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options: { returnDocument: 'after' },
  ): PromiseLike<T | null>;
  findOne(filter: Record<string, unknown>): PromiseLike<T | null>;
}

/**
 * Atomic optimistic-concurrency update (ADR-0006): applies `changes` only if the document still has
 * `expectedVersion`, and bumps `version`. Missing -> 404 NOT_FOUND, stale -> 409 CONFLICT with
 * `details: { currentVersion, updatedAt }`. Pass a workspace-scoped store so isolation is kept.
 */
export async function updateWithVersion<T extends Versioned>(
  store: VersionedStore<T>,
  filter: Record<string, unknown>,
  expectedVersion: number,
  changes: Record<string, unknown>,
): Promise<T> {
  const updated = await store.findOneAndUpdate(
    { ...filter, version: expectedVersion },
    { $set: changes, $inc: { version: 1 } },
    { returnDocument: 'after' },
  );
  if (updated) return updated;
  const current = await store.findOne(filter);
  if (!current) throw notFound();
  throw new AppError(409, 'CONFLICT', 'Nội dung đã được người khác cập nhật.', {
    currentVersion: current.version,
    updatedAt: current.updatedAt,
  });
}
