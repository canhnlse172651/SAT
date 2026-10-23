#!/usr/bin/env node
// Local MongoDB for `npm run dev` without Docker: mongodb-memory-server on 127.0.0.1:27017 with a persistent
// data directory (var/dev-mongo), so data survives restarts. Stop with Ctrl+C.
// With Docker running, `docker compose up -d mongo` is the equivalent.
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'var', 'dev-mongo');
mkdirSync(dbPath, { recursive: true });

const mongo = await MongoMemoryServer.create({
  instance: { ip: '127.0.0.1', port: 27017, dbPath, storageEngine: 'wiredTiger' },
});
console.log(`MongoDB dev: ${mongo.getUri('sat')}  (data: var/dev-mongo) — Ctrl+C để dừng`);

const stop = async () => {
  await mongo.stop({ doCleanup: false, force: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
