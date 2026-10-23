import { MAX_PAGE_LIMIT, paginationQuerySchema } from '@sat/shared';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { type Connection, type Model, Schema, Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../errors.js';
import { scoped } from '../tenancy/scoped.js';
import {
  baseSchemaOptions,
  toDto,
  versionField,
  workspaceIdField,
  workspaceIndex,
} from './base-schema.js';
import { cursorPage, paginate, toSkipLimit } from './pagination.js';
import { updateWithVersion } from './version.js';

interface Doc {
  title: string;
  secret?: string;
  version: number;
  updatedAt: Date;
}

let mongo: MongoMemoryServer;
let conn: Connection;
let Docs: Model<Doc>;
const ws = new Types.ObjectId();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  conn = await mongoose.createConnection(mongo.getUri('persistence')).asPromise();
  const schema = new Schema(
    { workspaceId: workspaceIdField, title: String, secret: String, version: versionField },
    baseSchemaOptions,
  );
  workspaceIndex(schema, { title: 1 });
  Docs = conn.model<Doc>('Doc', schema);
  await Docs.init();
});

afterAll(async () => {
  await conn.close();
  await mongo.stop();
});

beforeEach(async () => {
  await Docs.deleteMany({});
});

describe('baseSchemaOptions / toDto', () => {
  it('[000:AC-persistence] DTO hides _id, __v and workspaceId, exposes id', async () => {
    const doc = await scoped(Docs, ws).create({ title: 't' });
    const dto = toDto(doc);
    expect(dto).toMatchObject({ id: String(doc._id), title: 't', version: 1 });
    expect(dto).not.toHaveProperty('_id');
    expect(dto).not.toHaveProperty('__v');
    expect(dto).not.toHaveProperty('workspaceId');
    expect(doc.toJSON()).not.toHaveProperty('_id');
    expect(toDto(doc, ['title'])).toEqual({ id: String(doc._id), title: 't' });
    const lean = await Docs.findById(doc._id).lean();
    expect(toDto(lean as never)).toMatchObject({ id: String(doc._id) });
    expect(toDto(lean as never)).not.toHaveProperty('_id');
  });

  it('[000:AC-persistence] timestamps on, workspace index leads compound indexes', async () => {
    const doc = await scoped(Docs, ws).create({ title: 't' });
    expect(doc.updatedAt).toBeInstanceOf(Date);
    const idx = await Docs.collection.indexes();
    expect(idx.some((i) => Object.keys(i.key)[0] === 'workspaceId')).toBe(true);
  });

  it('[000:AC-persistence] workspaceId is required', async () => {
    await expect(Docs.create({ title: 'x' })).rejects.toThrow();
  });
});

describe('updateWithVersion', () => {
  it('[000:AC-persistence] increments version on match', async () => {
    const repo = scoped(Docs, ws);
    const doc = await repo.create({ title: 'a' });
    const updated = await updateWithVersion(repo, { _id: doc._id }, 1, { title: 'b' });
    expect(updated).toMatchObject({ title: 'b', version: 2 });
  });

  it('[000:AC-persistence] stale version -> 409 CONFLICT with currentVersion', async () => {
    const repo = scoped(Docs, ws);
    const doc = await repo.create({ title: 'a' });
    await updateWithVersion(repo, { _id: doc._id }, 1, { title: 'b' });
    const err = await updateWithVersion(repo, { _id: doc._id }, 1, { title: 'c' }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect((err as AppError).details).toMatchObject({ currentVersion: 2 });
    expect((await Docs.findById(doc._id))?.title).toBe('b');
  });

  it('[000:AC-persistence] missing or other-workspace doc -> 404', async () => {
    const doc = await scoped(Docs, ws).create({ title: 'a' });
    const other = scoped(Docs, new Types.ObjectId());
    await expect(
      updateWithVersion(other, { _id: doc._id }, 1, { title: 'x' }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});

describe('pagination', () => {
  it('[000:AC-persistence] schema rejects limit 0 and 101', () => {
    expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: MAX_PAGE_LIMIT + 1 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: 100 }).success).toBe(true);
    expect(toSkipLimit({ page: 3, limit: 500 })).toEqual({ skip: 200, limit: 100 });
  });

  it('[000:AC-persistence] pages, total and beyond-the-end', async () => {
    const repo = scoped(Docs, ws);
    for (let i = 0; i < 5; i++) await repo.create({ title: `t${i}` });
    await scoped(Docs, new Types.ObjectId()).create({ title: 'other' });
    const q = () => repo.find().sort({ title: 1 });
    const p2 = await paginate(q(), { page: 2, limit: 2 });
    expect(p2.items.map((d) => d.title)).toEqual(['t2', 't3']);
    expect([p2.page, p2.limit, p2.total]).toEqual([2, 2, 5]);
    const beyond = await paginate(q(), { page: 9, limit: 2 });
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(5);
  });

  it('[000:AC-persistence] cursor pages walk the list once', async () => {
    const repo = scoped(Docs, ws);
    for (let i = 0; i < 5; i++) await repo.create({ title: `t${i}` });
    const seen: string[] = [];
    let after: string | undefined;
    do {
      const page = await cursorPage(repo.find(), { after, limit: 2 });
      seen.push(...page.items.map((d) => d.title));
      after = page.nextCursor ?? undefined;
    } while (after);
    expect(seen).toEqual(['t0', 't1', 't2', 't3', 't4']);
    await expect(cursorPage(repo.find(), { after: 'garbage', limit: 2 })).rejects.toMatchObject({
      status: 404,
    });
  });
});
