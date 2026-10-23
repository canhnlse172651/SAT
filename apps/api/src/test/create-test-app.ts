import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ModuleMetadata } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../app.module.js';
import { configureApp } from '../app.js';
import { CLOCK, FixedClock } from '../common/ports/clock.js';
import { loadConfig } from '../config.js';

type Agent = ReturnType<typeof request.agent>;

export interface TestAppOptions {
  /** Shared by every injected `CLOCK`; defaults to a new `FixedClock`. */
  clock?: FixedClock;
  /** Extra modules (e.g. the feature under test). */
  imports?: NonNullable<ModuleMetadata['imports']>;
  controllers?: NonNullable<ModuleMetadata['controllers']>;
  providers?: NonNullable<ModuleMetadata['providers']>;
  /** Environment overrides for `loadConfig` (e.g. `APP_ORIGIN`). `NODE_ENV` is `test`. */
  env?: Record<string, string>;
}

export interface TestApp {
  app: NestExpressApplication;
  /** supertest agent with a cookie jar; sends `Origin: <origin>` so writes pass the Origin check. */
  http: Agent;
  clock: FixedClock;
  /** The allowed `APP_ORIGIN`. */
  origin: string;
  close(): Promise<void>;
}

/**
 * The real `AppModule` (ports in dev mode, dev endpoints, session, files) on an in-memory MongoDB
 * and a temp uploads dir, with the logger silenced and `CLOCK` replaced by a `FixedClock`.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const clock = options.clock ?? new FixedClock();
  const mongo = await MongoMemoryServer.create();
  const uploads = await mkdtemp(path.join(tmpdir(), 'sat-uploads-'));
  let app: NestExpressApplication | undefined;
  const close = async () => {
    await app?.close();
    await mongo.stop();
    await rm(uploads, { recursive: true, force: true });
  };
  try {
    const config = loadConfig({
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      MONGODB_URI: mongo.getUri('sat-test'),
      UPLOADS_DIR: uploads,
      ...options.env,
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(config), ...(options.imports ?? [])],
      controllers: options.controllers ?? [],
      providers: options.providers ?? [],
    })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
    configureApp(app);
    await app.init();
    const http = request.agent(app.getHttpServer()).set('Origin', config.APP_ORIGIN);
    return { app, http, clock, origin: config.APP_ORIGIN, close };
  } catch (err) {
    await close();
    throw err;
  }
}
