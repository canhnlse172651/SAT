/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
// Shared steps of the 005 QA scripts: data set-up through the API (as the test cases' preconditions say), exercise-set
// content builders (the "B6" set of test-cases.md), the HV's work through the S05 API and evidence screenshots.
// Not a test file.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { type APIRequestContext, type Browser, type Page, expect, request } from '@playwright/test';
import { loginAs } from '../../../../tests/e2e/fixtures';

export const ORIGIN = 'http://127.0.0.1:4173';
export const GV_VIEW = { viewport: { width: 1280, height: 800 } };
export const HV_VIEW = { viewport: { width: 390, height: 844 } };
export const MB = 1024 ** 2;

let seq = 0;
export const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
/** A part id (questions, options, blanks, pairs, tiles…). */
export const pid = (p = 'x') => `${p}${uid()}`.slice(0, 40);
/** Today in Vietnam (real time), YYYY-MM-DD. */
export const vnToday = (offsetDays = 0) =>
  new Date(Date.now() + 7 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);
/** dd/MM of a YYYY-MM-DD day. */
export const ddmm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Evidence screenshot into the run folder (when replayed / run by QA). */
export async function evidence(page: Page, tc: string, n = 1): Promise<void> {
  const dir = process.env.SAT_MODULE_RUN_DIR;
  if (!dir) return;
  mkdirSync(join(dir, 'screenshots'), { recursive: true });
  await page.screenshot({ path: join(dir, 'screenshots', `${tc}-${n}.png`), fullPage: true });
}

/** Raw call: `{ status, body }` whatever the status. */
export async function call(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown,
): Promise<{ status: number; body: any }> {
  const res = await page.request.fetch(path, {
    method,
    headers: { Origin: ORIGIN },
    ...(data === undefined ? {} : { data: data as any }),
  });
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* text */
  }
  return { status: res.status(), body };
}

export async function api<T = any>(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown,
  expectStatus?: number,
): Promise<T> {
  const r = await call(page, method, path, data);
  const show = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
  if (expectStatus !== undefined) expect(r.status, `${method} ${path}: ${show}`).toBe(expectStatus);
  else expect(r.status < 300, `${method} ${path}: ${r.status} ${show}`).toBeTruthy();
  return r.body as T;
}

/** A GV page (1280 × 800) and its session. */
export async function gvPage(browser: Browser) {
  const ctx = await browser.newContext({ ...GV_VIEW, baseURL: ORIGIN });
  const page = await ctx.newPage();
  const who = await loginAs(page, 'GV');
  return { ctx, page, who };
}

/** An HV page (390 × 844 unless `viewport`) signed in as the given seeded student. */
export async function hvPage(browser: Browser, userId: string, viewport = HV_VIEW.viewport) {
  const ctx = await browser.newContext({ viewport, baseURL: ORIGIN });
  const page = await ctx.newPage();
  const res = await page.request.post('/api/dev/session', {
    data: { role: 'HV', userId },
    headers: { Origin: ORIGIN },
  });
  expect(res.status(), await res.text()).toBe(201);
  return { ctx, page, who: await res.json() };
}

/** A GV of a brand-new workspace (registered through the A02 API) — workspace isolation cases. */
export async function otherGvPage(browser: Browser) {
  const ctx = await browser.newContext({ ...GV_VIEW, baseURL: ORIGIN });
  const page = await ctx.newPage();
  await page.request.delete('/api/dev/throttles', { headers: { Origin: ORIGIN } });
  const email = `gvb+${uid()}@sat.dev`;
  const res = await page.request.post('/api/auth/register', {
    headers: { Origin: ORIGIN },
    data: { displayName: 'GV B', email, password: 'QaPass2026x', passwordConfirm: 'QaPass2026x' },
  });
  expect(res.status(), await res.text()).toBe(201);
  return { ctx, page, who: await res.json(), email };
}

/** Ids of the seeded, activated students of the GV's workspace (hv1…hv3). */
export async function studentIds(gv: Page): Promise<string[]> {
  const res = await api<{ items: { id: string }[] }>(gv, 'GET', '/api/students');
  return res.items.map((s) => s.id);
}

/* ---------- 002: curriculum, Bài, items ---------- */

export async function newCurriculum(gv: Page, name = `QA 005 ${uid()}`) {
  return api<{ id: string }>(gv, 'POST', '/api/curricula', { name, hsk: 1 });
}
export async function newLesson(gv: Page, curriculumId: string, name = 'Bài 1') {
  return api<{ id: string; version: number }>(gv, 'POST', `/api/curricula/${curriculumId}/lessons`, { name });
}
export async function getLesson(gv: Page, lessonId: string) {
  return api<any>(gv, 'GET', `/api/lessons/${lessonId}`);
}
export async function itemOf(gv: Page, lessonId: string, itemId: string) {
  const l = await getLesson(gv, lessonId);
  return l.items.find((i: any) => i.id === itemId);
}
export async function addItem(gv: Page, lessonId: string, section: 'lesson' | 'exercise', afterItemId?: string) {
  const res = await api<{ itemId: string }>(gv, 'POST', `/api/lessons/${lessonId}/items`, {
    section,
    ...(afterItemId ? { afterItemId } : {}),
  });
  return res.itemId;
}
const version = async (gv: Page, lessonId: string, itemId: string): Promise<number> =>
  (await itemOf(gv, lessonId, itemId)).version;

export async function saveItem(gv: Page, lessonId: string, itemId: string, title: string, content: unknown, extra: object = {}) {
  return call(gv, 'PUT', `/api/lessons/${lessonId}/items/${itemId}`, {
    expectedVersion: await version(gv, lessonId, itemId),
    title,
    content,
    ...extra,
  });
}
export async function publishItem(gv: Page, lessonId: string, itemId: string, title: string, content: unknown) {
  return api(gv, 'POST', `/api/lessons/${lessonId}/items/${itemId}/publish`, {
    expectedVersion: await version(gv, lessonId, itemId),
    title,
    content,
  });
}
export async function archiveItem(gv: Page, lessonId: string, itemId: string) {
  return api(gv, 'POST', `/api/lessons/${lessonId}/items/${itemId}/archive`, {
    expectedVersion: await version(gv, lessonId, itemId),
  });
}
export async function restoreItem(gv: Page, lessonId: string, itemId: string) {
  return api(gv, 'POST', `/api/lessons/${lessonId}/items/${itemId}/restore`, {
    expectedVersion: await version(gv, lessonId, itemId),
  });
}
export async function deleteItem(gv: Page, lessonId: string, itemId: string) {
  return call(gv, 'DELETE', `/api/lessons/${lessonId}/items/${itemId}`);
}
export async function publishLesson(gv: Page, lessonId: string) {
  const l = await getLesson(gv, lessonId);
  return api(gv, 'POST', `/api/lessons/${lessonId}/publish`, { expectedVersion: l.version, itemIds: [] });
}

/** A saved draft set. */
export async function draftSet(gv: Page, lessonId: string, title: string, content: any) {
  const id = await addItem(gv, lessonId, 'exercise');
  const r = await saveItem(gv, lessonId, id, title, content);
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return id;
}
/** A published set. */
export async function publishedSet(gv: Page, lessonId: string, title: string, content: any) {
  const id = await addItem(gv, lessonId, 'exercise');
  await publishItem(gv, lessonId, id, title, content);
  return id;
}
/** A published step (004) with one text block. */
export async function publishedStep(gv: Page, lessonId: string, title: string) {
  const id = await addItem(gv, lessonId, 'lesson');
  await publishItem(gv, lessonId, id, title, { goal: '', blocks: [{ id: 't', type: 'text', html: '<p>你好</p>' }] });
  return id;
}

/* ---------- 003: class, deadlines, visibility ---------- */

export async function newClass(gv: Page, curriculumId: string, students: string[], startDate = vnToday()) {
  return api<{ id: string; name: string }>(gv, 'POST', '/api/classes', {
    name: `Lớp QA ${uid()}`,
    startDate,
    curriculumId,
    studentIds: students,
    createKey: `qa-${uid()}`,
  });
}
export async function setDeadline(gv: Page, classId: string, setId: string, date: string | null) {
  return api(gv, 'PUT', `/api/classes/${classId}/deadlines`, { target: { setId }, date });
}
export async function hideSection(gv: Page, classId: string, lessonId: string, hidden = true) {
  return api(gv, 'PUT', `/api/classes/${classId}/visibility`, {
    hidden,
    scope: { kind: 'section', lessonId, section: 'exercise' },
  });
}
export async function endClass(gv: Page, classId: string) {
  return api(gv, 'POST', `/api/classes/${classId}/end`);
}
export async function removeStudent(gv: Page, classId: string, studentId: string) {
  return call(gv, 'DELETE', `/api/classes/${classId}/students/${studentId}`);
}

/** Moves the server clock (dev) to `iso` (forward only from now) — reset with `resetClock`. */
export async function clockTo(page: Page, iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  expect(ms, 'clockTo goes forward').toBeGreaterThan(0);
  await api(page, 'DELETE', '/api/dev/clock', undefined);
  return api(page, 'POST', '/api/dev/clock', { advanceMs: ms });
}
export async function advanceClock(page: Page, ms: number) {
  return api(page, 'POST', '/api/dev/clock', { advanceMs: ms });
}
export async function resetClock(page: Page) {
  return call(page, 'DELETE', '/api/dev/clock');
}

/** Bài 1 published with the given sets (published), a class of the seeded students with a deadline for each set. */
export async function classWithSets(
  gv: Page,
  sets: { title: string; content: any; deadline?: string | null }[],
  opts: { students?: string[]; lessonName?: string } = {},
) {
  const cur = await newCurriculum(gv);
  const les = await newLesson(gv, cur.id, opts.lessonName ?? 'Bài 1');
  const ids: string[] = [];
  for (const s of sets) ids.push(await publishedSet(gv, les.id, s.title, s.content));
  await publishLesson(gv, les.id);
  const students = opts.students ?? (await studentIds(gv));
  const cls = await newClass(gv, cur.id, students);
  for (const [k, s] of sets.entries()) {
    const d = s.deadline === undefined ? vnToday(7) : s.deadline;
    if (d) await setDeadline(gv, cls.id, ids[k]!, d);
  }
  return { cur: cur.id, les: les.id, cls: cls.id, sets: ids, students };
}

/* ---------- HV work (S05 API) ---------- */

const learn = (cls: string, set: string) => `/api/learn/classes/${cls}/sets/${set}`;
export const start = (hv: Page, cls: string, set: string) => call(hv, 'POST', `${learn(cls, set)}/start`);
export const view = (hv: Page, cls: string, set: string) => call(hv, 'GET', learn(cls, set));
export const saveAnswers = (hv: Page, cls: string, set: string, answers: object, lastIndex?: number) =>
  call(hv, 'PUT', `${learn(cls, set)}/attempt`, { answers, ...(lastIndex === undefined ? {} : { lastIndex }) });
export const submit = (hv: Page, cls: string, set: string, answers: object = {}, submitKey = `k${uid()}xxxxxxxx`) =>
  call(hv, 'POST', `${learn(cls, set)}/submit`, { submitKey, answers });
export const review = (hv: Page, cls: string, set: string) => call(hv, 'GET', `${learn(cls, set)}/review`);

/** Start, then submit `answers` (by question id). */
export async function doSet(hv: Page, cls: string, set: string, answers: object) {
  const s = await start(hv, cls, set);
  expect(s.status, JSON.stringify(s.body)).toBeLessThan(300);
  const r = await submit(hv, cls, set, answers);
  expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
  return r.body;
}

/* ---------- screens ---------- */

export const T04 = (cls: string) => `/gv/lop-hoc/${cls}`;
export const T06 = (cur: string) => `/gv/giao-trinh/${cur}`;
export const T07 = (cur: string, les: string) => `/gv/giao-trinh/${cur}/bai/${les}/bai-hoc`;
export const T09 = (cur: string, les: string) => `/gv/giao-trinh/${cur}/bai/${les}/thu-cong`;
export const T14 = (cls: string, hv: string, set: string) => `/gv/bai-nop?lop=${cls}&hv=${hv}&bo=${set}`;
export const T18 = (cur: string, les: string) => `/gv/giao-trinh/${cur}/bai/${les}`;
export const T21 = (cur: string, les: string) => `/gv/giao-trinh/${cur}/bai/${les}/xem-truoc`;
export const S03 = (cls: string, step: string) => `/hv/lop/${cls}/buoc/${step}`;
export const S05 = (cls: string, set: string) => `/hv/lop/${cls}/bai-tap/${set}`;
export const S06 = (cls: string, set: string) => `/hv/lop/${cls}/bai-tap/${set}/ket-qua`;
export const S11 = (cls: string, les: string) => `/hv/lop/${cls}/bai/${les}`;

/** The block of set n (1-based, section order) on T09. */
export const setBlock = (page: Page, n: number) => page.getByRole('region', { name: `Bộ bài tập ${n}`, exact: true });

/* ---------- content builders (ids given, as the editor would) ---------- */

type Opt = { text: string; correct?: boolean; image?: any };
const options = (opts: Opt[]) =>
  opts.map((o) => ({ id: pid('o'), text: o.text, image: o.image ?? null, correct: !!o.correct }));

export const mcq = (prompt: string, opts: Opt[], extra: Record<string, unknown> = {}) => ({
  id: pid('q'),
  type: 'mcq',
  prompt,
  image: null,
  explanation: '',
  multi: false,
  options: options(opts),
  points: 1,
  ...extra,
});
export const vocab = (
  variant: 'meaning' | 'hanzi' | 'pinyin',
  word: { word?: string; wordPinyin?: string; meaning?: string },
  opts: Opt[],
  extra: Record<string, unknown> = {},
) => ({
  id: pid('q'),
  type: 'vocab',
  variant,
  prompt: { meaning: 'Chọn nghĩa đúng của từ', hanzi: 'Chọn chữ Hán đúng', pinyin: 'Chọn pinyin đúng' }[variant],
  image: null,
  explanation: '',
  word: word.word ?? '',
  wordPinyin: word.wordPinyin ?? '',
  meaning: word.meaning ?? '',
  options: options(opts),
  points: 1,
  ...extra,
});
/** `passage` with `[[answer]]` marks; each mark becomes a blank accepting that answer (+ `more[i]`). */
export const cloze = (prompt: string, passage: string, more: string[][] = [], extra: Record<string, unknown> = {}) => {
  const blanks: { id: string; answers: string[]; points: number }[] = [];
  const text = passage.replace(/\[\[([^\]]+)\]\]/g, (_m, a: string) => {
    const id = pid('b');
    blanks.push({ id, answers: [a, ...(more[blanks.length] ?? [])], points: 1 });
    return `[[${id}]]`;
  });
  return { id: pid('q'), type: 'cloze', prompt, image: null, explanation: '', text, blanks, ...extra };
};
export const match = (prompt: string, pairs: [string, string][], distractors: string[] = [], extra: Record<string, unknown> = {}) => ({
  id: pid('q'),
  type: 'match',
  prompt,
  image: null,
  explanation: '',
  headA: 'Cột A',
  headB: 'Cột B',
  pairs: pairs.map(([a, b]) => ({ id: pid('p'), a, b, bId: pid('m'), points: 1 })),
  distractors: distractors.map((text) => ({ id: pid('d'), text })),
  ...extra,
});
export const order = (prompt: string, tiles: string[], extra: Record<string, unknown> = {}) => ({
  id: pid('q'),
  type: 'order',
  prompt,
  image: null,
  explanation: '',
  tiles: tiles.map((text) => ({ id: pid('t'), text })),
  alternatives: [],
  points: 1,
  ...extra,
});
export const write = (prompt: string, pinyin: string, answers: string[], hint = '', extra: Record<string, unknown> = {}) => ({
  id: pid('q'),
  type: 'write',
  prompt,
  image: null,
  explanation: '',
  pinyin,
  hint,
  answers,
  points: 1,
  ...extra,
});
export const reading = (prompt: string, passage: string, subs: any[], passagePinyin = '', extra: Record<string, unknown> = {}) => ({
  id: pid('q'),
  type: 'reading',
  prompt,
  image: null,
  explanation: '',
  passage,
  passagePinyin,
  subs,
  ...extra,
});
export const set = (questions: any[], instructions = '', stepId: string | null = null) => ({ instructions, stepId, questions });

/**
 * "B6": 1 MCQ, 1 Chọn nghĩa, 1 cloze of 2 blanks, 1 matching of 4 pairs + 1 distractor, 1 ordering 我/是/越南/人,
 * 1 write nǐ hǎo → 你好, 1 reading of 2 sub-questions; 5 questions with an explanation; total 12.
 */
export function b6() {
  const qs = [
    mcq('你好 nǐ hǎo là gì?', [{ text: 'Tạm biệt' }, { text: 'Xin chào', correct: true }, { text: 'Cảm ơn' }], {
      explanation: '你好 = xin chào.',
    }),
    vocab('meaning', { word: '谢谢', wordPinyin: 'xie4xie' }, [{ text: 'cảm ơn', correct: true }, { text: 'xin lỗi' }], {
      explanation: '谢谢 = cảm ơn.',
    }),
    cloze('Điền vào chỗ trống', '我[[是]]越南[[人]]。', [], { explanation: '我是越南人 = tôi là người Việt Nam.' }),
    match('Nối từ với nghĩa', [['你好', 'xin chào'], ['谢谢', 'cảm ơn'], ['再见', 'tạm biệt'], ['老师', 'giáo viên']], ['học sinh']),
    order('Sắp xếp thành câu', ['我', '是', '越南', '人'], { explanation: 'Chủ ngữ + 是 + danh từ.' }),
    write('Viết chữ Hán', 'nǐ hǎo', ['你好'], 'xin chào'),
    reading('Đọc đoạn văn và trả lời', '我叫小明。我是学生。', [
      { ...mcq('小明 là ai?', [{ text: 'Giáo viên' }, { text: 'Học sinh', correct: true }]), explanation: '学生 = học sinh.' },
      { ...cloze('Tên của bạn ấy là', '小[[明]]'), explanation: '' },
    ]),
  ];
  return set(qs, 'Làm hết 7 câu.');
}

/** Answers by question id for a B6 set as saved (read back from the API, ids as stored). */
export function b6Answers(content: any, opts: { correct?: boolean[] } = {}) {
  const ok = (k: number) => opts.correct?.[k] ?? true;
  const qs = content.questions;
  const a: Record<string, any> = {};
  const pick = (q: any, right: boolean) => [q.options.find((o: any) => o.correct === right).id];
  a[qs[0].id] = { optionIds: pick(qs[0], ok(0)) };
  a[qs[1].id] = { optionIds: pick(qs[1], ok(1)) };
  a[qs[2].id] = { blanks: Object.fromEntries(qs[2].blanks.map((b: any) => [b.id, ok(2) ? b.answers[0] : 'sai'])) };
  a[qs[3].id] = {
    pairs: Object.fromEntries(qs[3].pairs.map((p: any, k: number) => [p.id, ok(3) ? p.bId : qs[3].pairs[(k + 1) % 4].bId])),
  };
  a[qs[4].id] = { tiles: (ok(4) ? qs[4].tiles : [...qs[4].tiles].reverse()).map((t: any) => t.id) };
  a[qs[5].id] = { text: ok(5) ? '你好' : '您好' };
  const [s1, s2] = qs[6].subs;
  a[qs[6].id] = {
    subs: {
      [s1.id]: { optionIds: pick(s1, ok(6)) },
      [s2.id]: { blanks: { [s2.blanks[0].id]: ok(6) ? '明' : '红' } },
    },
  };
  return a;
}

/** The set's content as saved. */
export async function setContent(gv: Page, lessonId: string, setId: string) {
  return (await itemOf(gv, lessonId, setId)).content;
}

/* ---------- files ---------- */

/** A real 2 × 2 PNG. */
export const png = (): Buffer =>
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP4z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
    'base64',
  );
/** A PNG of `size` bytes (valid header, padded). */
export const bigPng = (size: number): Buffer => {
  const b = Buffer.alloc(size);
  png().copy(b);
  return b;
};
export const bmp = (): Buffer => {
  const b = Buffer.alloc(70);
  b.write('BM', 0);
  return b;
};
export async function upload(gv: Page, name: string, bytes: Buffer) {
  const res = await gv.request.post('/api/steps/files?kind=questionImage', {
    headers: { Origin: ORIGIN, 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(name) },
    data: bytes,
  });
  return { status: res.status(), body: await res.json() };
}
export async function setStorage(gv: Page, usedBytes: number) {
  return api(gv, 'POST', '/api/dev/steps/storage', { usedBytes: Math.round(usedBytes) }, 204);
}
export async function storage(gv: Page) {
  return api<any>(gv, 'GET', '/api/steps/storage');
}

/** Selects a file through the button that opens the file chooser. */
export async function chooseFile(page: Page, button: ReturnType<Page['getByRole']>, file: { name: string; mimeType: string; buffer: Buffer }) {
  const chooser = page.waitForEvent('filechooser');
  await button.click();
  await (await chooser).setFiles(file);
}

/* ---------- load cases (NFR-1, NFR-5): a workspace of its own with many activated students ---------- */

/** Signed-in API context of an HV (no browser page): for load cases. */
export async function hvApi(userId: string, origin = ORIGIN): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin } });
  const res = await ctx.post('/api/dev/session', { data: { role: 'HV', userId } });
  expect(res.status(), await res.text()).toBe(201);
  return ctx;
}
export async function rawCall(ctx: APIRequestContext, method: string, path: string, data?: unknown) {
  const t0 = Date.now();
  const res = await ctx.fetch(path, { method, ...(data === undefined ? {} : { data: data as any }) });
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* text */
  }
  return { status: res.status(), body, ms: Date.now() - t0 };
}
/** Runs `fn` over `items` with at most `n` at a time. */
export async function pool<T, R>(items: readonly T[], n: number, fn: (item: T, k: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const k = next++;
        out[k] = await fn(items[k]!, k);
      }
    }),
  );
  return out;
}
export const p95 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.max(0, Math.ceil(xs.length * 0.95) - 1)]!;

/** A new GV workspace with `n` activated students (created and activated through the 001 API). */
export async function workspaceWithStudents(browser: Browser, n: number) {
  const gv = await otherGvPage(browser);
  const ids = await pool(Array.from({ length: n }, (_, k) => k), 10, async (k) => {
    const s = await api<{ id: string }>(gv.page, 'POST', '/api/students', {
      displayName: `Học viên tải ${k + 1}`,
      email: `tai${k + 1}.${uid()}@sat.dev`,
    });
    await api(gv.page, 'POST', `/api/students/${s.id}/activate`);
    return s.id;
  });
  return { ...gv, students: ids };
}

/* ---------- 010 stand-in (T20 approval of the Bài tập section) ---------- */

export async function aiPreview(gv: Page, lessonId: string, items: { title: string; content: unknown }[]) {
  return call(gv, 'POST', '/api/dev/curriculum/ai-approve/preview', { lessonId, section: 'exercise', items });
}
export async function aiApprove(gv: Page, lessonId: string, items: { title: string; content: unknown }[], token?: string) {
  const t = token ?? (await aiPreview(gv, lessonId, items)).body.token;
  return call(gv, 'POST', '/api/dev/curriculum/ai-approve', { lessonId, section: 'exercise', items, token: t });
}
