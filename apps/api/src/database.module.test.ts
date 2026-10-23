// Integration test against a real (in-memory) MongoDB — proves the persistence path end to end.
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import mongoose, { type Connection } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { DB_READY, type DbReady, DatabaseModule } from './database.module.js';
import { withMongo } from './test/with-mongo.js';

const mongo = withMongo();

describe('DatabaseModule', () => {
  it('connects, round-trips a document, and reports readiness', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule.forRoot(mongo.uri('sat-test'))],
    }).compile();
    await moduleRef.init();
    const isDbReady = moduleRef.get<DbReady>(DB_READY);
    expect(isDbReady()).toBe(true);

    const connection = moduleRef.get<Connection>(getConnectionToken());
    const Probe = connection.model('Probe', new mongoose.Schema({ value: String }));
    await Probe.create({ value: 'ping' });
    expect(await Probe.findOne({ value: 'ping' }).lean()).toMatchObject({ value: 'ping' });

    await moduleRef.close();
    expect(isDbReady()).toBe(false);
  });
});
