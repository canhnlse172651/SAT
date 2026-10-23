import { getModelToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module.js';
import { configureApp } from '../../app.js';
import { loadConfig } from '../../config.js';
import { DatabaseModule } from '../../database.module.js';
import { loggerParams } from '../../logger.js';
import { createTestApp, withMongo, type TestApp } from '../../test/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { ContextModule } from '../context/context.module.js';
import {
  DEV_USER_MODEL,
  DEV_WORKSPACE_MODEL,
  DirectoryModule,
  type DevUserDoc,
  type DevWorkspaceDoc,
} from '../directory/index.js';
import { EMAIL_SENDER, type EmailSender, PortsModule } from '../ports/index.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { devModules } from './dev.module.js';
import { SEED_HV_NAMES, SEED_WORKSPACE_NAME, seedDev } from './seed.js';

describe('dev endpoints (test mode)', () => {
  let kit: TestApp;
  beforeAll(async () => {
    kit = await createTestApp();
  });
  afterAll(async () => {
    await kit.close();
  });

  const models = () => ({
    workspaces: kit.app.get<Model<DevWorkspaceDoc>>(getModelToken(DEV_WORKSPACE_MODEL), {
      strict: false,
    }),
    users: kit.app.get<Model<DevUserDoc>>(getModelToken(DEV_USER_MODEL), { strict: false }),
  });

  it('[000:AC-dev] POST /api/dev/session signs in a seeded user and sets an httpOnly cookie', async () => {
    const { workspaces, users } = models();
    const seeded = await seedDev(workspaces, users);
    const res = await request(kit.app.getHttpServer())
      .post('/api/dev/session')
      .set('Origin', kit.origin)
      .send({ role: 'HV', userId: seeded.hvIds[1] });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      user: { id: seeded.hvIds[1], role: 'HV', displayName: SEED_HV_NAMES[1] },
      workspace: { id: seeded.workspaceId, name: SEED_WORKSPACE_NAME },
    });
    const cookie = String(res.headers['set-cookie']?.[0]);
    expect(cookie).toMatch(/^sat_sid=.+; HttpOnly; SameSite=Lax/);
    const me = await request(kit.app.getHttpServer())
      .get('/api/session')
      .set('Cookie', cookie.split(';')[0] ?? '');
    expect(me.status).toBe(200);
  });

  it('[000:AC-dev] without userId it picks the first user of the role; unknown user is 404', async () => {
    const { workspaces, users } = models();
    const seeded = await seedDev(workspaces, users);
    const gv = await kit.http.post('/api/dev/session').send({ role: 'GV' });
    expect(gv.body.user.id).toBe(seeded.gvId);
    const unknown = await kit.http
      .post('/api/dev/session')
      .send({ role: 'GV', userId: '64b7f0c2a1b2c3d4e5f60718' });
    expect(unknown.status).toBe(404);
  });

  it('[000:AC-dev] validates the body (400) and enforces the Origin check (403)', async () => {
    const bad = await kit.http.post('/api/dev/session').send({ role: 'ADMIN' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    const evil = await request(kit.app.getHttpServer())
      .post('/api/dev/session')
      .set('Origin', 'https://evil.example')
      .send({ role: 'GV' });
    expect(evil.status).toBe(403);
  });

  it('[000:AC-dev] GET /api/dev/outbox returns sent mail filtered by recipient and tag', async () => {
    const sender = kit.app.get<EmailSender>(EMAIL_SENDER);
    const mail = { subject: 's', html: '<p>x</p>', text: 'x' };
    await sender.send({ ...mail, to: 'a@example.test', tag: 'activation' });
    await sender.send({ ...mail, to: 'a@example.test', tag: 'reminder' });
    await sender.send({ ...mail, to: 'b@example.test', tag: 'activation' });
    const res = await request(kit.app.getHttpServer())
      .get('/api/dev/outbox')
      .query({ to: 'a@example.test', tag: 'activation' });
    expect(res.status).toBe(200);
    expect(res.body.emails).toHaveLength(1);
    expect(res.body.emails[0]).toMatchObject({ to: 'a@example.test', tag: 'activation' });
  });
});

describe('production', () => {
  const mongo = withMongo();
  const production = () =>
    loadConfig({
      NODE_ENV: 'production',
      APP_ORIGIN: 'https://sat.example.com',
      MONGODB_URI: mongo.uri('sat-prod'),
      LOG_LEVEL: 'silent',
    });

  it('[000:AC-dev] devModules registers nothing outside development and test', () => {
    expect(devModules('production')).toEqual([]);
    expect(devModules('development')).toHaveLength(1);
    expect(devModules('test')).toHaveLength(1);
  });

  it('[000:AC-dev] ADR-0008: AppModule refuses to start in production with dev adapters', () => {
    expect(() => AppModule.forRoot(production())).toThrow(/ADR-0008/);
  });

  it('[000:AC-dev] a production composition exposes no /api/dev/*', async () => {
    const config = production();
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(loggerParams('silent')),
        ContextModule,
        DatabaseModule.forRoot(config.MONGODB_URI),
        PortsModule.forRoot({ mode: 'dev' }),
        TenancyModule,
        DirectoryModule,
        AuthModule.forRoot(config),
        ...devModules(config.NODE_ENV),
      ],
    }).compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
    configureApp(app);
    await app.init();
    try {
      const server = app.getHttpServer();
      const outbox = await request(server).get('/api/dev/outbox');
      expect(outbox.status).toBe(404);
      const session = await request(server)
        .post('/api/dev/session')
        .set('Origin', config.APP_ORIGIN)
        .send({ role: 'GV' });
      expect(session.status).toBe(404);
    } finally {
      await app.close();
    }
  });
});
