import { MAX_PAGE_LIMIT, type PageResult, type PaginationQuery } from '@sat/shared';
import { type Query, Types } from 'mongoose';
import { notFound } from '../tenancy/not-found.js';

const clampLimit = (limit: number): number =>
  Math.min(Math.max(1, Math.trunc(limit)), MAX_PAGE_LIMIT);

/** `?page&limit` -> skip/limit; limit is clamped to the hard maximum even if validation was skipped. */
export function toSkipLimit(page: PaginationQuery): { skip: number; limit: number } {
  const limit = clampLimit(page.limit);
  const pageNo = Math.max(1, Math.trunc(page.page));
  return { skip: (pageNo - 1) * limit, limit };
}

/** Runs `query` (already filtered and sorted) for one page and counts the total with the same filter. */
export async function paginate<T>(
  query: Query<T[], T>,
  page: PaginationQuery,
): Promise<PageResult<T>> {
  const { skip, limit } = toSkipLimit(page);
  const [items, total] = await Promise.all([
    query.clone().skip(skip).limit(limit),
    query.model.countDocuments(query.getFilter()),
  ]);
  return { items, page: Math.max(1, Math.trunc(page.page)), limit, total };
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export const encodeCursor = (id: unknown): string => Buffer.from(String(id)).toString('base64url');

/** Decodes a cursor; a malformed cursor gets the uniform 404. */
export function decodeCursor(cursor: string): Types.ObjectId {
  const id = Buffer.from(cursor, 'base64url').toString();
  if (id.length !== 24 || !Types.ObjectId.isValid(id)) throw notFound();
  return new Types.ObjectId(id);
}

/** Cursor pagination by ascending `_id`: `after` is the `nextCursor` of the previous page. */
export async function cursorPage<T extends { _id: unknown }>(
  query: Query<T[], T>,
  opts: { after?: string | undefined; limit: number },
): Promise<CursorPage<T>> {
  const limit = clampLimit(opts.limit);
  const q = query.clone();
  if (opts.after) q.where('_id').gt(decodeCursor(opts.after) as never);
  const rows = await q.sort({ _id: 1 }).limit(limit + 1);
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  return { items, nextCursor: rows.length > limit && last ? encodeCursor(last._id) : null };
}
