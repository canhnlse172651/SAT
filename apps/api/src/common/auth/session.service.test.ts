import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { type Model, Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CLOCK, FixedClock } from '../ports/clock.js';
import { AUTH_OPTIONS, type AuthOptions, SESSION_PRINCIPAL_RESOLVER } from './auth.types.js';
import { SESSION_MODEL, type SessionRecord, sessionSchema } from './session.model.js';
import { hashToken, SessionService } from './session.service.js';

const options: AuthOptions = {
  sessionTtlGvHours: 8,
  sessionTtlHvDays: 30,
  cookieSecure: false,
  allowedOrigins: [],
};
const H = 3_600_000;
const D = 24 * H;

let mongo: MongoMemoryServer;
let moduleRef: TestingModule;
let service: SessionService;
let model: Model<SessionRecord>;
let clock: FixedClock;
let verdict: { active: true } | { active: false; reason: 'locked' | 'missing' };

const id = () => new Types.ObjectId().toString();
const gv = () => ({ userId: id(), role: 'GV' as const, workspaceId: id() });
const hv = () => ({ userId: id(), role: 'HV' as const, workspaceId: id() });
const outcome = (p: Promise<unknown>) =>
  p.then(
    () => 'ok',
    (e: { status: number; code: string; details?: { reason: string } }) =>
      `${e.status}:${e.code}:${e.details?.reason}`,
  );

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  clock = new FixedClock('2026-03-01T08:00:00.000Z');
  moduleRef = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongo.getUri('sat-session-test')),
      MongooseModule.forFeature([{ name: SESSION_MODEL, schema: sessionSchema }]),
    ],
    providers: [
      SessionService,
      { provide: CLOCK, useValue: clock },
      { provide: AUTH_OPTIONS, useValue: options },
      { provide: SESSION_PRINCIPAL_RESOLVER, useValue: { check: async () => verdict } },
    ],
  }).compile();
  await moduleRef.init();
  service = moduleRef.get(SessionService);
  model = moduleRef.get(getModelToken(SESSION_MODEL));
  await model.init();
});

afterAll(async () => {
  await moduleRef.close();
  await mongo.stop();
});

beforeEach(async () => {
  clock.set('2026-03-01T08:00:00.000Z');
  verdict = { active: true };
  await model.deleteMany({});
});

describe('SessionService', () => {
  it('create stores only the token hash and validate returns the principal', async () => {
    const input = gv();
    const { token, session } = await service.create(input);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const stored = await model.findOne({}).lean();
    expect(stored?.tokenHash).toBe(hashToken(token));
    expect(JSON.stringify(stored)).not.toContain(token);
    expect(session.maxAgeSeconds).toBe(8 * 3600);
    expect(await service.validate(token)).toMatchObject({
      ...input,
      sessionId: session.sessionId,
    });
  });

  it('issues a different token for every session', async () => {
    const input = hv();
    const a = await service.create(input);
    const b = await service.create(input);
    expect(a.token).not.toBe(b.token);
  });

  it('an unknown token is 401 UNAUTHENTICATED (missing)', async () => {
    expect(await outcome(service.validate('nope'))).toBe('401:UNAUTHENTICATED:missing');
  });

  it('GV idle expiry is 8 hours; activity slides the window', async () => {
    const { token } = await service.create(gv());
    clock.advance(7 * H);
    await expect(service.validate(token)).resolves.toBeDefined(); // touch at +7h
    clock.advance(7 * H); // 14h after creation, 7h after last activity
    await expect(service.validate(token)).resolves.toBeDefined();
    clock.advance(8 * H);
    expect(await outcome(service.validate(token))).toBe('401:UNAUTHENTICATED:expired');
    expect(await outcome(service.validate(token))).toBe('401:UNAUTHENTICATED:expired');
    expect((await model.findOne({}).lean())?.endReason).toBe('expired');
  });

  it('HV idle expiry is 30 days, not 8 hours', async () => {
    const { token } = await service.create(hv());
    clock.advance(29 * D);
    await expect(service.validate(token)).resolves.toBeDefined();
    clock.advance(30 * D);
    expect(await outcome(service.validate(token))).toBe('401:UNAUTHENTICATED:expired');
  });

  it('throttles the sliding touch to once per minute', async () => {
    const { token } = await service.create(gv());
    clock.advance(30_000);
    expect((await service.validate(token)).refreshed).toBe(false);
    clock.advance(31_000);
    expect((await service.validate(token)).refreshed).toBe(true);
    const stored = await model.findOne({}).lean();
    expect(stored?.lastSeenAt.toISOString()).toBe(clock.now().toISOString());
    expect(stored?.idleExpiresAt.getTime()).toBe(clock.now().getTime() + 8 * H);
  });

  it('revoke ends only that session', async () => {
    const input = hv();
    const a = await service.create(input);
    const b = await service.create(input);
    await service.revoke(a.session.sessionId);
    expect(await outcome(service.validate(a.token))).toBe('401:UNAUTHENTICATED:expired');
    await expect(service.validate(b.token)).resolves.toBeDefined();
  });

  it('revokeAllExcept keeps the given session and other users untouched', async () => {
    const input = hv();
    const a = await service.create(input);
    const b = await service.create(input);
    const other = await service.create(hv());
    await service.revokeAllExcept(input.userId, a.session.sessionId);
    await expect(service.validate(a.token)).resolves.toBeDefined();
    expect(await outcome(service.validate(b.token))).toBe('401:UNAUTHENTICATED:expired');
    await expect(service.validate(other.token)).resolves.toBeDefined();
  });

  it('revokeAll with reason locked yields reason "locked"', async () => {
    const input = hv();
    const a = await service.create(input);
    await service.revokeAll(input.userId, 'locked');
    expect(await outcome(service.validate(a.token))).toBe('401:UNAUTHENTICATED:locked');
  });

  it('the principal resolver can reject a locked account immediately', async () => {
    const { token } = await service.create(hv());
    verdict = { active: false, reason: 'locked' };
    expect(await outcome(service.validate(token))).toBe('401:UNAUTHENTICATED:locked');
    verdict = { active: true };
    expect(await outcome(service.validate(token))).toBe('401:UNAUTHENTICATED:locked');
  });

  it('declares the unique token index and the TTL purge index', async () => {
    const indexes = await model.collection.indexes();
    expect(indexes.find((i) => i.key['tokenHash'])?.unique).toBe(true);
    expect(indexes.find((i) => i.key['purgeAt'])?.expireAfterSeconds).toBe(0);
  });
});
