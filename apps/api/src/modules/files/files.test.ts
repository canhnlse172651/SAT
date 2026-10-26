import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getConnectionToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import request from 'supertest';
import { FILE_STORAGE, type FileStorage } from '../../common/ports/storage.js';
import { createTestApp, loginAs, makeGv, type TestApp } from '../../test/index.js';

let kit: TestApp;
beforeAll(async () => {
  kit = await createTestApp();
});
afterAll(async () => {
  await kit.close();
});

const bytes = Buffer.from('hello hanzi 你好');

async function upload(workspaceId: string, contentType = 'text/plain', filename = 'bài 1.txt') {
  const storage = kit.app.get<FileStorage>(FILE_STORAGE);
  return storage.put({ workspaceId, ownerId: 'u1', filename, contentType, bytes });
}

describe('GET /api/files/:id', () => {
  it('[000:AC-files] streams the file to its own workspace with type and private caching', async () => {
    const gv = await makeGv(kit.app);
    const { cookie } = await loginAs(kit.app, 'GV', { userId: gv.id, workspaceId: gv.workspaceId });
    const file = await upload(gv.workspaceId, 'image/png', 'ảnh.png');
    const res = await request(kit.app.getHttpServer())
      .get(`/api/files/${file.id}`)
      .set('Cookie', cookie)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.headers['cache-control']).toBe('private');
    expect(res.headers['content-disposition']).toBe(
      `inline; filename*=UTF-8''${encodeURIComponent('ảnh.png')}`,
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect((res.body as Buffer).equals(bytes)).toBe(true);
  });

  it('[000:AC-files] non-media types are downloaded, not rendered', async () => {
    const gv = await makeGv(kit.app);
    const { cookie } = await loginAs(kit.app, 'GV', { userId: gv.id, workspaceId: gv.workspaceId });
    const file = await upload(gv.workspaceId, 'text/html', 'x.html');
    const res = await request(kit.app.getHttpServer())
      .get(`/api/files/${file.id}`)
      .set('Cookie', cookie);
    expect(res.headers['content-disposition']).toMatch(/^attachment;/);
  });

  it("[000:AC-files] another workspace's file is the uniform 404", async () => {
    const owner = await makeGv(kit.app);
    const other = await makeGv(kit.app);
    const file = await upload(owner.workspaceId);
    const { cookie } = await loginAs(kit.app, 'GV', {
      userId: other.id,
      workspaceId: other.workspaceId,
    });
    const res = await request(kit.app.getHttpServer())
      .get(`/api/files/${file.id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('[000:AC-files] a missing id gives the same 404 as another workspace', async () => {
    const { cookie } = await loginAs(kit.app, 'GV');
    const res = await request(kit.app.getHttpServer())
      .get('/api/files/64b7f0c2a1b2c3d4e5f60718')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('[004:NFR-6] lesson media are refused to an HV by id (only signed step links serve them)', async () => {
    const gv = await makeGv(kit.app);
    const file = await upload(gv.workspaceId, 'image/png', 'bài.png');
    const plain = await upload(gv.workspaceId, 'image/png', 'bìa.png');
    await kit.app
      .get(getConnectionToken())
      .collection('lesson_files')
      .insertOne({
        workspaceId: new Types.ObjectId(gv.workspaceId),
        fileId: file.id,
        kind: 'block',
      });
    const { cookie } = await loginAs(kit.app, 'HV', { workspaceId: gv.workspaceId });
    const http = request(kit.app.getHttpServer());
    expect((await http.get(`/api/files/${file.id}`).set('Cookie', cookie)).status).toBe(404);
    expect((await http.get(`/api/files/${plain.id}`).set('Cookie', cookie)).status).toBe(200);
  });

  it('[000:AC-files] requires a session', async () => {
    const res = await request(kit.app.getHttpServer()).get('/api/files/64b7f0c2a1b2c3d4e5f60718');
    expect(res.status).toBe(401);
  });
});
