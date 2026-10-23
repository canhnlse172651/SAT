import { sessionFailureReasonSchema, sessionResponseSchema } from '@sat/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import request from 'supertest';
import { SessionService } from '../../common/auth/session.service.js';
import { createTestApp, loginAs, makeGv, makeHv, type TestApp } from '../../test/index.js';

let kit: TestApp;
beforeAll(async () => {
  kit = await createTestApp();
});
afterAll(async () => {
  await kit.close();
});

const get = (cookie?: string) => {
  const req = request(kit.app.getHttpServer()).get('/api/session');
  return cookie ? req.set('Cookie', cookie) : req;
};

describe('GET /api/session', () => {
  it('[000:AC-session] 200 with the shared session shape for a GV', async () => {
    const gv = await makeGv(kit.app, { displayName: 'Cô Lan' });
    const { cookie } = await loginAs(kit.app, 'GV', { userId: gv.id, workspaceId: gv.workspaceId });
    const res = await get(cookie);
    expect(res.status).toBe(200);
    const body = sessionResponseSchema.parse(res.body);
    expect(body.user).toEqual({ id: gv.id, role: 'GV', displayName: 'Cô Lan' });
    expect(body.workspace.id).toBe(gv.workspaceId);
  });

  it('[000:AC-session] 200 for an HV with its own role', async () => {
    const hv = await makeHv(kit.app);
    const { cookie } = await loginAs(kit.app, 'HV', { userId: hv.id, workspaceId: hv.workspaceId });
    const res = await get(cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('HV');
  });

  it('[000:AC-session] 401 reason "missing" without a cookie, with the error contract', async () => {
    const res = await get();
    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHENTICATED',
      details: { reason: 'missing' },
    });
    expect(typeof res.body.error.requestId).toBe('string');
  });

  it('[000:AC-session] 401 reason "expired" after the idle window', async () => {
    const gv = await makeGv(kit.app);
    const { cookie } = await loginAs(kit.app, 'GV', { userId: gv.id, workspaceId: gv.workspaceId });
    kit.clock.advance(9 * 3_600_000);
    const res = await get(cookie);
    expect(res.status).toBe(401);
    expect(sessionFailureReasonSchema.parse(res.body.error.details.reason)).toBe('expired');
  });

  it('[000:AC-session] 401 reason "locked" once the session ended as locked', async () => {
    const gv = await makeGv(kit.app);
    const { cookie, userId } = await loginAs(kit.app, 'GV', {
      userId: gv.id,
      workspaceId: gv.workspaceId,
    });
    await kit.app.get(SessionService).revokeAll(userId, 'locked');
    const res = await get(cookie);
    expect(res.status).toBe(401);
    expect(res.body.error.details).toEqual({ reason: 'locked' });
  });

  it('[000:AC-session] a session whose user no longer exists in the directory is 401 "missing"', async () => {
    const gone = new Types.ObjectId().toString();
    const { cookie } = await loginAs(kit.app, 'GV', { userId: gone, workspaceId: gone });
    const res = await get(cookie);
    expect(res.status).toBe(401);
    expect(res.body.error.details).toEqual({ reason: 'missing' });
  });
});
