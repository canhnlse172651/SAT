import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DatabaseModule } from '../../database.module.js';
import {
  CLOCK,
  DevOutboxReader,
  EMAIL_SENDER,
  FILE_STORAGE,
  FixedClock,
  JOB_SCHEDULER,
  ManualScheduler,
  MemoryEmailSender,
  MemoryStorage,
  PortsModule,
  vnToday,
  type EmailSender,
  type FileStorage,
} from './index.js';

async function read(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString();
}

describe('Clock', () => {
  it('FixedClock stays put, can be set and advanced', () => {
    const clock = new FixedClock('2026-03-01T00:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-03-01T00:00:00.000Z');
    clock.advance(90_000);
    expect(clock.now().toISOString()).toBe('2026-03-01T00:01:30.000Z');
    clock.set('2027-01-01T00:00:00.000Z');
    expect(clock.now().getUTCFullYear()).toBe(2027);
  });

  it('vnToday returns VN midnight of the current VN day', () => {
    // 20:00 UTC on 1 Mar = 03:00 on 2 Mar in Vietnam
    const clock = new FixedClock('2026-03-01T20:00:00.000Z');
    expect(vnToday(clock).toISOString()).toBe('2026-03-01T17:00:00.000Z');
  });
});

describe('MemoryEmailSender', () => {
  it('records and finds messages by recipient and tag', async () => {
    const sender = new MemoryEmailSender();
    const base = { subject: 's', html: '<p>h</p>', text: 't' };
    await sender.send({ ...base, to: 'a@x.vn', tag: 'activation' });
    await sender.send({ ...base, to: 'a@x.vn', tag: 'reminder' });
    expect(sender.find('a@x.vn', 'reminder')).toHaveLength(1);
    expect(sender.find('b@x.vn')).toHaveLength(0);
  });
});

describe('MemoryStorage', () => {
  it('enforces size and content-type limits', async () => {
    const storage = new MemoryStorage({ maxBytes: 4, allowedContentTypes: ['text/plain'] });
    const input = {
      workspaceId: 'w1',
      ownerId: 'u1',
      filename: 'a.txt',
      contentType: 'text/plain',
    };
    await expect(storage.put({ ...input, bytes: Buffer.from('12345') })).rejects.toMatchObject({
      status: 413,
    });
    await expect(
      storage.put({ ...input, contentType: 'image/png', bytes: Buffer.from('1') }),
    ).rejects.toMatchObject({ status: 415 });
    const { id } = await storage.put({ ...input, stream: Readable.from([Buffer.from('ok')]) });
    expect(await read((await storage.get(id))!.stream)).toBe('ok');
  });
});

describe('ManualScheduler', () => {
  it('runs a one-off job only once the clock passes runAt', async () => {
    const clock = new FixedClock('2026-03-01T00:00:00.000Z');
    const scheduler = new ManualScheduler(clock);
    const handler = vi.fn();
    scheduler.handle('send', handler);
    await scheduler.schedule('send', new Date('2026-03-01T01:00:00.000Z'), { n: 1 });
    expect(await scheduler.runDue()).toBe(0);
    clock.advance(3_600_000);
    expect(await scheduler.runDue()).toBe(1);
    expect(handler).toHaveBeenCalledWith({ n: 1 });
    expect(await scheduler.runDue()).toBe(0);
  });

  it('runs a daily VN-time job each day at 08:00', async () => {
    const clock = new FixedClock('2026-03-01T00:00:00.000Z'); // 07:00 VN
    const scheduler = new ManualScheduler(clock);
    const handler = vi.fn();
    scheduler.every('remind', '08:00', handler);
    expect(await scheduler.runDue()).toBe(0);
    clock.advance(3_600_000); // 08:00 VN
    expect(await scheduler.runDue()).toBe(1);
    expect(await scheduler.runDue()).toBe(0);
    clock.advance(24 * 3_600_000);
    expect(await scheduler.runDue()).toBe(1);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('rejects a malformed daily time', () => {
    expect(() => new ManualScheduler(new FixedClock()).every('x', '8am', vi.fn())).toThrow();
  });
});

describe('PortsModule test mode', () => {
  it('binds in-memory adapters without a database', async () => {
    const ref = await Test.createTestingModule({
      imports: [PortsModule.forRoot({ mode: 'test' })],
    }).compile();
    expect(ref.get(CLOCK)).toBeInstanceOf(FixedClock);
    expect(ref.get(EMAIL_SENDER)).toBeInstanceOf(MemoryEmailSender);
    expect(ref.get(FILE_STORAGE)).toBeInstanceOf(MemoryStorage);
    expect(ref.get(JOB_SCHEDULER)).toBeInstanceOf(ManualScheduler);
  });
});

describe('PortsModule dev mode (MongoDB + disk)', () => {
  let mongo: MongoMemoryServer;
  let dir: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    dir = await mkdtemp(path.join(tmpdir(), 'sat-uploads-'));
  });

  afterAll(async () => {
    await mongo.stop();
    await rm(dir, { recursive: true, force: true });
  });

  it('stores outbox mail without leaking recipient/body to logs, and stores files on disk', async () => {
    const ref = await Test.createTestingModule({
      imports: [
        DatabaseModule.forRoot(mongo.getUri('sat-ports')),
        PortsModule.forRoot({
          mode: 'dev',
          uploadsDir: dir,
          storage: { maxBytes: 10, allowedContentTypes: ['text/plain'] },
        }),
      ],
    }).compile();
    await ref.init();

    // outbox
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const sender = ref.get<EmailSender>(EMAIL_SENDER);
    const { id } = await sender.send({
      to: 'hv@example.com',
      subject: 'Kích hoạt',
      html: '<p>secret-body</p>',
      text: 'secret-body',
      tag: 'activation',
    });
    const logged = JSON.stringify(logSpy.mock.calls);
    logSpy.mockRestore();
    expect(logged).not.toContain('hv@example.com');
    expect(logged).not.toContain('secret-body');

    const reader = ref.get(DevOutboxReader);
    const found = await reader.findByRecipient('hv@example.com', 'activation');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ id, text: 'secret-body', tag: 'activation' });
    expect((await reader.latest(5))[0]?.id).toBe(id);
    expect(await reader.findByRecipient('hv@example.com', 'other')).toHaveLength(0);

    // storage
    const storage = ref.get<FileStorage>(FILE_STORAGE);
    const input = {
      workspaceId: 'w1',
      ownerId: 'u1',
      filename: 'a.txt',
      contentType: 'text/plain',
    };
    const meta = await storage.put({ ...input, bytes: Buffer.from('hello') });
    expect(meta).toMatchObject({ size: 5, contentType: 'text/plain' });
    const got = await storage.get(meta.id);
    expect(got?.metadata).toMatchObject({ workspaceId: 'w1', filename: 'a.txt' });
    expect(await read(got!.stream)).toBe('hello');

    for (const filename of ['../evil.txt', 'a/b.txt', 'a\\b.txt', '..', '']) {
      await expect(
        storage.put({ ...input, filename, bytes: Buffer.from('x') }),
      ).rejects.toMatchObject({
        code: 'INVALID_FILENAME',
      });
    }
    await expect(
      storage.put({ ...input, workspaceId: '../w', bytes: Buffer.from('x') }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      storage.put({ ...input, bytes: Buffer.from('12345678901') }),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      storage.put({ ...input, contentType: 'image/png', bytes: Buffer.from('x') }),
    ).rejects.toMatchObject({ status: 415 });

    await storage.delete(meta.id);
    expect(await storage.get(meta.id)).toBeNull();
    expect(await readdir(path.join(dir, 'w1'))).toHaveLength(0);

    await ref.close();
  });
});
