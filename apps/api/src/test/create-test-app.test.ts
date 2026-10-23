// F07 smoke: the kit boots the real AppModule and its pieces work together.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FixedClock } from '../common/ports/clock.js';
import { createTestApp, loginAs, makeGv, makeHv, makeWorkspace, type TestApp } from './index.js';

let kit: TestApp;
const clock = new FixedClock('2026-05-05T01:00:00.000Z');

beforeAll(async () => {
  kit = await createTestApp({ clock });
});
afterAll(async () => {
  await kit.close();
});

describe('createTestApp', () => {
  it('serves the app and shares the clock', async () => {
    expect((await kit.http.get('/api/health')).body).toEqual({ status: 'ok' });
    expect(kit.clock).toBe(clock);
  });

  it('factories create a workspace with a GV and HV, and loginAs signs in as them', async () => {
    const ws = await makeWorkspace(kit.app, { name: 'Kit workspace' });
    const gv = await makeGv(kit.app, { workspaceId: ws.id, displayName: 'Cô Kit' });
    const hv = await makeHv(kit.app, { workspaceId: ws.id });
    expect([gv.workspaceId, hv.workspaceId]).toEqual([ws.id, ws.id]);

    const { cookie } = await loginAs(kit.app, 'GV', { workspaceId: ws.id, userId: gv.id });
    const res = await kit.http.get('/api/session').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { id: gv.id, role: 'GV', displayName: 'Cô Kit' },
      workspace: { id: ws.id, name: 'Kit workspace' },
    });
  });

  it('the agent keeps cookies between requests and sends an allowed Origin on writes', async () => {
    const gv = await makeGv(kit.app);
    const login = await kit.http.post('/api/dev/session').send({ role: 'GV', userId: gv.id });
    expect(login.status).toBe(201);
    expect((await kit.http.get('/api/session')).status).toBe(200);
  });
});
