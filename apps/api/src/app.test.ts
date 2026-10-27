// Walking-skeleton tests: infrastructure only, so they cite no acceptance criterion.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type DynamicModule, Global, Module } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApp } from './app.js';
import { DB_READY, type DbReady } from './database.module.js';
import { loggerParams } from './logger.js';
import { HealthModule } from './modules/health/health.module.js';

/** Stands in for DatabaseModule so HTTP tests need no MongoDB. */
@Global()
@Module({})
class FakeDatabaseModule {
  static with(isDbReady: DbReady): DynamicModule {
    return {
      module: FakeDatabaseModule,
      providers: [{ provide: DB_READY, useValue: isDbReady }],
      exports: [DB_READY],
    };
  }
}

let app: NestExpressApplication | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function server(isDbReady: DbReady = () => true, webDistDir?: string) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      LoggerModule.forRoot(loggerParams('silent')),
      FakeDatabaseModule.with(isDbReady),
      HealthModule,
    ],
  }).compile();
  app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
  configureApp(app, { webDistDir });
  await app.init();
  return app.getHttpServer();
}

describe('health endpoints', () => {
  it('GET /api/health reports liveness', async () => {
    const res = await request(await server()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/ready is 200 when MongoDB is connected', async () => {
    const res = await request(await server(() => true)).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.checks).toEqual({ mongo: 'up' });
  });

  it('GET /api/ready is 503 when MongoDB is down', async () => {
    const res = await request(await server(() => false)).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'not_ready', checks: { mongo: 'down' } });
  });
});

describe('error contract', () => {
  it('unknown API routes return the JSON error shape with a request id', async () => {
    const res = await request(await server())
      .get('/api/nope')
      .set('x-request-id', 'req-123');
    expect(res.status).toBe(404);
    expect(res.headers['x-request-id']).toBe('req-123');
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', requestId: 'req-123' });
  });

  it('malformed JSON is a 400, not a 500', async () => {
    const res = await request(await server())
      .post('/api/health')
      .set('content-type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(await server()).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('SPA hosting', () => {
  it('serves index.html for client-side routes when a web build is present', async () => {
    const dist = mkdtempSync(join(tmpdir(), 'web-dist-'));
    writeFileSync(join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
    const res = await request(await server(() => true, dist)).get('/some/client/route');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('keeps unknown /api routes as JSON 404s even with a web build present', async () => {
    const dist = mkdtempSync(join(tmpdir(), 'web-dist-'));
    writeFileSync(join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
    const res = await request(await server(() => true, dist)).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('sends scripts and styles gzip-compressed to browsers that accept it (004 NFR-1: phones on 4G)', async () => {
    const dist = mkdtempSync(join(tmpdir(), 'web-dist-'));
    writeFileSync(join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
    mkdirSync(join(dist, 'assets'));
    const js = `export const a = "${'x'.repeat(5000)}";`;
    writeFileSync(join(dist, 'assets', 'index-abc.js'), js);
    writeFileSync(join(dist, 'assets', 'logo-abc.png'), 'png');
    const http = await server(() => true, dist);

    const packed = await request(http)
      .get('/assets/index-abc.js')
      .set('accept-encoding', 'gzip, deflate, br');
    expect(packed.status).toBe(200);
    expect(packed.headers['content-encoding']).toBe('gzip');
    expect(packed.headers['vary']).toMatch(/Accept-Encoding/i);
    expect(packed.headers['content-type']).toMatch(/javascript/);
    expect(packed.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(Number(packed.headers['content-length'])).toBeLessThan(js.length / 10);
    expect(packed.text).toBe(js); // supertest unzips; the length above is what was sent

    const plain = await request(http)
      .get('/assets/index-abc.js')
      .set('accept-encoding', 'identity');
    expect(plain.headers['content-encoding']).toBeUndefined();
    expect(plain.text).toBe(js);
    const image = await request(http).get('/assets/logo-abc.png').set('accept-encoding', 'gzip');
    expect(image.headers['content-encoding']).toBeUndefined();
    const missing = await request(http).get('/assets/nope.js').set('accept-encoding', 'gzip');
    expect(missing.headers['content-encoding']).toBeUndefined();
    const outside = await request(http)
      .get('/assets/..%2Findex.html')
      .set('accept-encoding', 'gzip');
    expect(outside.headers['content-encoding']).toBeUndefined();
  });
});
