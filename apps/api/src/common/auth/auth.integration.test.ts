import { Controller, Get, Post } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loginAs } from '../../test/login-as.js';
import { createTestApp, type TestApp } from '../../test/create-test-app.js';
import { requireContext } from '../context/request-context.js';
import { FixedClock } from '../ports/clock.js';
import type { AuthPrincipal } from './auth.types.js';
import { CurrentUser, Public, Roles } from './decorators.js';

@Controller('probe')
class ProbeController {
  @Public()
  @Get('open')
  open() {
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthPrincipal) {
    return { ...user, ctx: requireContext() };
  }

  @Roles('GV')
  @Get('teacher')
  teacher() {
    return { ok: true };
  }

  @Public()
  @Post('write')
  write() {
    return { written: true };
  }
}

const ORIGIN = 'https://sat.example.com';
const START = '2026-03-01T08:00:00.000Z';

let kit: TestApp;
const clock = new FixedClock(START);

async function login(role: 'GV' | 'HV') {
  const { cookie, userId, workspaceId } = await loginAs(kit.app, role);
  return { cookie, session: { userId, workspaceId } };
}

const http = () => request(kit.app.getHttpServer());

beforeAll(async () => {
  kit = await createTestApp({
    clock,
    env: { APP_ORIGIN: ORIGIN },
    controllers: [ProbeController],
  });
});

afterAll(async () => {
  await kit.close();
});

describe('AuthGuard', () => {
  it('401 UNAUTHENTICATED (missing) without a cookie', async () => {
    const res = await http().get('/api/probe/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHENTICATED',
      details: { reason: 'missing' },
    });
    expect(res.headers['set-cookie']?.[0]).toContain('Max-Age=0');
  });

  it('401 with an unknown session id', async () => {
    const res = await http().get('/api/probe/me').set('Cookie', 'sat_sid=bogus');
    expect(res.status).toBe(401);
  });

  it('@Public routes pass without a session', async () => {
    expect((await http().get('/api/probe/open')).status).toBe(200);
  });

  it('a valid session fills @CurrentUser and the request context (same request id)', async () => {
    const { cookie, session } = await login('GV');
    const res = await http()
      .get('/api/probe/me')
      .set('Cookie', cookie)
      .set('x-request-id', 'req-42');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      userId: session.userId,
      role: 'GV',
      workspaceId: session.workspaceId,
    });
    expect(res.body.ctx).toEqual({
      requestId: 'req-42',
      userId: session.userId,
      role: 'GV',
      workspaceId: session.workspaceId,
    });
  });

  it('wrong role is 404 NOT_FOUND, right role is 200', async () => {
    const student = await login('HV');
    const teacher = await login('GV');
    const denied = await http().get('/api/probe/teacher').set('Cookie', student.cookie);
    expect(denied.status).toBe(404);
    expect(denied.body.error.code).toBe('NOT_FOUND');
    const ok = await http().get('/api/probe/teacher').set('Cookie', teacher.cookie);
    expect(ok.status).toBe(200);
  });

  it('an idle-expired session is 401 and the cookie is cleared', async () => {
    const { cookie } = await login('GV');
    clock.advance(9 * 3_600_000);
    const res = await http().get('/api/probe/me').set('Cookie', cookie);
    clock.set(START);
    expect(res.status).toBe(401);
    expect(res.body.error.details).toEqual({ reason: 'expired' });
    expect(res.headers['set-cookie']?.[0]).toContain('Max-Age=0');
  });

  it('re-sends the cookie (HttpOnly, SameSite=Lax, Secure) when the window slides', async () => {
    const { cookie } = await login('GV');
    clock.advance(2 * 60_000);
    const res = await http().get('/api/probe/me').set('Cookie', cookie);
    clock.set(START);
    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('Max-Age=28800');
  });
});

describe('Origin check', () => {
  it('rejects a write from another origin with 403 FORBIDDEN', async () => {
    const res = await http().post('/api/probe/write').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects a write with neither Origin nor Referer', async () => {
    expect((await http().post('/api/probe/write')).status).toBe(403);
  });

  it('allows APP_ORIGIN, and falls back to Referer', async () => {
    expect((await http().post('/api/probe/write').set('Origin', ORIGIN)).status).toBe(201);
    const viaReferer = await http().post('/api/probe/write').set('Referer', `${ORIGIN}/page`);
    expect(viaReferer.status).toBe(201);
    const evil = await http().post('/api/probe/write').set('Referer', 'https://evil.example/x');
    expect(evil.status).toBe(403);
  });

  it('does not restrict GET', async () => {
    const res = await http().get('/api/probe/open').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
  });
});
