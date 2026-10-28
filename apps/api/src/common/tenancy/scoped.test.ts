// Tenancy proof (ADR-0006): workspace B can never see or change workspace A's documents.
import mongoose, { type Connection, type Model, Schema, Types } from 'mongoose';
import { withMongo } from '../../test/with-mongo.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { baseSchemaOptions, workspaceIdField } from '../persistence/base-schema.js';
import { NOT_FOUND_MESSAGE, notFound, orNotFound } from './not-found.js';
import { scoped } from './scoped.js';

interface Item {
  workspaceId: Types.ObjectId;
  name: string;
  qty: number;
  tags?: { k: string; v: number }[];
}

const mongo = withMongo();
let conn: Connection;
let Items: Model<Item>;
const wsA = new Types.ObjectId();
const wsB = new Types.ObjectId();

beforeAll(async () => {
  conn = await mongoose.createConnection(mongo.uri('tenancy')).asPromise();
  Items = conn.model<Item>(
    'Item',
    new Schema(
      {
        workspaceId: workspaceIdField,
        name: String,
        qty: Number,
        tags: [{ _id: false, k: String, v: Number }],
      },
      baseSchemaOptions,
    ),
  );
});

afterAll(async () => {
  await conn.close();
});

let aDoc: { _id: Types.ObjectId };
beforeEach(async () => {
  await Items.deleteMany({});
  aDoc = await scoped(Items, wsA).create({ name: 'same', qty: 1 });
  await scoped(Items, wsB).create({ name: 'same', qty: 1 });
});

describe('scoped()', () => {
  it('[000:AC-tenancy] create stamps the workspace and ignores a spoofed one', async () => {
    const doc = await scoped(Items, wsB).create({ name: 'x', workspaceId: wsA });
    expect(String(doc.workspaceId)).toBe(String(wsB));
  });

  it('[000:AC-tenancy] reads never cross workspaces', async () => {
    const b = scoped(Items, wsB);
    expect(await b.find()).toHaveLength(1);
    expect(await b.find({ workspaceId: wsA })).toHaveLength(1);
    expect((await b.find({ workspaceId: wsA }))[0]?.workspaceId).toEqual(wsB);
    expect(await b.findOne({ _id: aDoc._id })).toBeNull();
    expect(await b.findById(aDoc._id)).toBeNull();
    expect(await b.findById(String(aDoc._id))).toBeNull();
    expect(await b.exists({ _id: aDoc._id })).toBeNull();
    expect(await b.count()).toBe(1);
    expect(await scoped(Items, wsA).findById(aDoc._id)).not.toBeNull();
  });

  it('[000:AC-tenancy] findById of a malformed id is simply not found', async () => {
    expect(await scoped(Items, wsA).findById('nope')).toBeNull();
  });

  it('[000:AC-tenancy] writes never touch another workspace', async () => {
    const b = scoped(Items, wsB);
    expect((await b.updateOne({ _id: aDoc._id }, { qty: 9 })).matchedCount).toBe(0);
    expect((await b.updateMany({}, { $set: { qty: 5 } })).modifiedCount).toBe(1);
    expect(
      await b.findOneAndUpdate({ _id: aDoc._id }, { qty: 7 }, { returnDocument: 'after' }),
    ).toBeNull();
    expect((await b.deleteOne({ _id: aDoc._id })).deletedCount).toBe(0);
    expect((await b.deleteMany({})).deletedCount).toBe(1);
    const stillA = await Items.findById(aDoc._id);
    expect(stillA?.qty).toBe(1);
  });

  it('[000:AC-tenancy] update options (arrayFilters) pass through, still within the workspace', async () => {
    const tags = [
      { k: 'x', v: 1 },
      { k: 'y', v: 1 },
      { k: 'x', v: 1 },
    ];
    await Items.updateMany({}, { $set: { tags } });
    const a = scoped(Items, wsA);
    const r = await a.updateMany(
      {},
      { $set: { 'tags.$[t].v': 2 } },
      { arrayFilters: [{ 't.k': 'x' }] },
    );
    expect(r.modifiedCount).toBe(1);
    expect((await Items.findById(aDoc._id))?.toObject().tags?.map((t) => t.v)).toEqual([2, 1, 2]);
    const other = await scoped(Items, wsB).findOne({});
    expect(other?.toObject().tags?.map((t) => t.v)).toEqual([1, 1, 1]);
    await a.updateOne(
      { _id: aDoc._id },
      { $set: { 'tags.$[t].v': 3 } },
      { arrayFilters: [{ 't.k': 'y' }] },
    );
    expect((await Items.findById(aDoc._id))?.toObject().tags?.map((t) => t.v)).toEqual([2, 3, 2]);
  });

  it('[000:AC-tenancy] aggregate always starts with the workspace $match', async () => {
    const out = await scoped(Items, wsB).aggregate([
      { $match: { workspaceId: wsA } },
      { $group: { _id: null, n: { $sum: 1 } } },
    ]);
    expect(out).toEqual([]);
    const own = await scoped(Items, wsA).aggregate([{ $group: { _id: null, n: { $sum: 1 } } }]);
    expect(own).toEqual([{ _id: null, n: 1 }]);
  });

  it('[000:AC-tenancy] fails closed without a valid workspace', () => {
    expect(() => scoped(Items, '')).toThrowError(/workspace/i);
    expect(() => scoped(Items, undefined as unknown as string)).toThrowError(/workspace/i);
  });
});

describe('notFound helpers', () => {
  it('[000:AC-tenancy] uniform 404', () => {
    const err = notFound();
    expect([err.status, err.code, err.message]).toEqual([404, 'NOT_FOUND', NOT_FOUND_MESSAGE]);
    expect(() => orNotFound(null)).toThrowError(NOT_FOUND_MESSAGE);
    expect(orNotFound(1)).toBe(1);
  });
});
