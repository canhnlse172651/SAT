import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll } from 'vitest';

/**
 * Call at `describe`/file level: starts an in-memory MongoDB before the tests and stops it after.
 * `uri(db)` is valid inside tests and hooks.
 */
export function withMongo(): { uri(dbName?: string): string } {
  let mongo: MongoMemoryServer | undefined;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
  });
  afterAll(async () => {
    await mongo?.stop();
  });
  return {
    uri(dbName = 'sat-test') {
      if (!mongo) throw new Error('withMongo(): uri() called before beforeAll ran');
      return mongo.getUri(dbName);
    },
  };
}
