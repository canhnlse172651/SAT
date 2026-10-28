/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { expect, request, test } from '@playwright/test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mcq, pid, set } from './helpers';

// NFR-10 needs the server's log lines: a second hermetic server (same build) on its own port with LOG_LEVEL=info.
const PORT = 4174;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const ROOT = new URL('../../../../', import.meta.url);
let mongo: MongoMemoryServer;
let api: ChildProcess;
const lines: string[] = [];

test.beforeAll(async () => {
  test.setTimeout(120_000);
  mongo = await MongoMemoryServer.create();
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(PORT),
    APP_ORIGIN: ORIGIN,
    MONGODB_URI: mongo.getUri('sat-e2e-log'),
    WEB_DIST_DIR: 'apps/web/dist',
    LOG_LEVEL: 'info',
  };
  expect(spawnSync(process.execPath, ['apps/api/dist/seed.js'], { cwd: ROOT, env }).status).toBe(0);
  api = spawn(process.execPath, ['apps/api/dist/main.js'], { cwd: ROOT, env });
  let buf = '';
  api.stdout!.on('data', (c: Buffer) => {
    buf += c.toString('utf8');
    const parts = buf.split('\n');
    buf = parts.pop() ?? '';
    lines.push(...parts);
  });
  for (let k = 0; k < 100; k++) {
    const ok = await fetch(`${ORIGIN}/api/ready`).then((r) => r.ok).catch(() => false);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('log server did not start');
});
test.afterAll(async () => {
  api?.kill();
  await mongo?.stop();
});

test('[005:NFR-10] TC-122 one structured log line per action, no content or PII', async () => {
  const ctx = async (data: object) => {
    const c = await request.newContext({ baseURL: ORIGIN, extraHTTPHeaders: { Origin: ORIGIN } });
    expect((await c.post('/api/dev/session', { data })).status()).toBe(201);
    return c;
  };
  const gv = await ctx({ role: 'GV' });
  const j = async (c: typeof gv, m: string, path: string, data?: unknown) => {
    const r = await c.fetch(path, { method: m, ...(data === undefined ? {} : { data: data as any }) });
    const t = await r.text();
    expect(r.status(), `${m} ${path}: ${t}`).toBeLessThan(300);
    return t ? JSON.parse(t) : null;
  };
  const students = (await j(gv, 'GET', '/api/students')).items;
  const hvId = students[0].id;
  const email = students[0].email;
  const name = students[0].displayName;
  const cur = await j(gv, 'POST', '/api/curricula', { name: 'Log 005', hsk: 1 });
  const les = await j(gv, 'POST', `/api/curricula/${cur.id}/lessons`, { name: 'Bài log' });
  const ver = async (id: string) => (await j(gv, 'GET', `/api/lessons/${les.id}`)).items.find((i: any) => i.id === id).version;
  const PROMPT = 'NOI DUNG CAU HOI LOG';
  const content = set([mcq(PROMPT, [{ text: 'DAP AN DUNG LOG', correct: true }, { text: 'Sai' }])]);
  const setA = (await j(gv, 'POST', `/api/lessons/${les.id}/items`, { section: 'exercise' })).itemId;
  const setB = (await j(gv, 'POST', `/api/lessons/${les.id}/items`, { section: 'exercise' })).itemId;
  for (const s of [setA, setB]) await j(gv, 'POST', `/api/lessons/${les.id}/items/${s}/publish`, { expectedVersion: await ver(s), title: 'Bộ log', content });
  await j(gv, 'POST', `/api/lessons/${les.id}/publish`, { expectedVersion: (await j(gv, 'GET', `/api/lessons/${les.id}`)).version, itemIds: [] });
  const cls = await j(gv, 'POST', '/api/classes', { name: 'Lớp log', startDate: new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10), curriculumId: cur.id, studentIds: [hvId], createKey: `k-${pid()}` });
  await j(gv, 'PUT', `/api/classes/${cls.id}/deadlines`, { target: { setId: setA }, date: new Date(Date.now() + 7 * 3600e3 + 5 * 86400e3).toISOString().slice(0, 10) });
  // Actions: publish (above), submit, re-grade, duplicate, archive, restore, delete.
  const hv = await ctx({ role: 'HV', userId: hvId });
  const saved = (await j(gv, 'GET', `/api/lessons/${les.id}`)).items.find((i: any) => i.id === setA).content;
  await j(hv, 'POST', `/api/learn/classes/${cls.id}/sets/${setA}/start`);
  await j(hv, 'POST', `/api/learn/classes/${cls.id}/sets/${setA}/submit`, { submitKey: 'logkey12345678', answers: { [saved.questions[0].id]: { optionIds: [saved.questions[0].options[0].id] } } });
  const edited = structuredClone(saved);
  edited.questions[0].options.forEach((o: any, k: number) => (o.correct = k === 1));
  await j(gv, 'PUT', `/api/lessons/${les.id}/items/${setA}`, { expectedVersion: await ver(setA), title: 'Bộ log', content: edited, confirmRegrade: true });
  await j(gv, 'POST', `/api/lessons/${les.id}/items/${setA}/duplicate`);
  await j(gv, 'POST', `/api/lessons/${les.id}/items/${setB}/archive`, { expectedVersion: await ver(setB) });
  await j(gv, 'POST', `/api/lessons/${les.id}/items/${setB}/restore`, { expectedVersion: await ver(setB) });
  const copy = (await j(gv, 'GET', `/api/lessons/${les.id}`)).items.find((i: any) => i.title.endsWith('(bản sao)')).id;
  await j(gv, 'DELETE', `/api/lessons/${les.id}/items/${copy}`);
  await new Promise((r) => setTimeout(r, 500));

  // The log.
  const parsed = lines.flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  });
  const app = parsed.filter((p) => typeof p.action === 'string');
  const actions = app.map((p) => `${p.context ?? ''}:${p.action}`);
  console.log(`TC-122 actions logged: ${JSON.stringify(actions)}`);
  const has = (re: RegExp) => app.find((p) => re.test(String(p.action ?? '')));
  const want: [string, RegExp][] = [
    ['xuất bản', /publish/],
    ['lưu trữ', /archive/],
    ['khôi phục', /restore/],
    ['xóa', /delete|remove/],
    ['nhân bản', /duplicate/],
    ['nộp', /submit/],
    ['chấm lại', /regrade/],
  ];
  const missing = want.filter(([, re]) => !has(re)).map(([n]) => n);
  expect(missing, 'actions without a log line').toEqual([]);
  for (const [n, re] of want) {
    const e = has(re)!;
    expect(e.time ?? e.timestamp, `${n}: time`).toBeTruthy();
    expect(e.userId ?? e.actorId, `${n}: actor`).toBeTruthy();
    expect(e.result ?? e.outcome, `${n}: result`).toBeTruthy();
    expect(e.setId ?? e.itemId ?? e.submissionId ?? e.lessonId, `${n}: set / submission id`).toBeTruthy();
  }
  expect(Object.keys(has(/regrade/)!).some((k) => /count|regraded|submissions/.test(k)), 'regrade count').toBe(true);
  const all = lines.join('\n');
  for (const pii of [PROMPT, 'DAP AN DUNG LOG', email, name]) expect(all, `log contains ${pii}`).not.toContain(pii);
  await gv.dispose();
  await hv.dispose();
});
