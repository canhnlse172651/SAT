/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
// Shared steps of the 006 QA scripts: data set-up through the API (as test-cases.md "Dữ liệu và tài khoản dùng chung" says),
// the "E3" exam content, the HV's attempt through the S08 API, the server clock and evidence screenshots. Not a test file.
// The question builders and raw API helpers are 005's (same content shape).
import { type Browser, type Page, expect } from '@playwright/test';
import { api, call, match, mcq, pid, uid, workspaceWithStudents, write } from '../../../005-exercises/testing/e2e/helpers';

export {
  api,
  call,
  cloze,
  evidence,
  hvApi,
  match,
  mcq,
  order,
  otherGvPage,
  pid,
  pool,
  rawCall,
  reading,
  uid,
  write,
} from '../../../005-exercises/testing/e2e/helpers';

export const ORIGIN = 'http://127.0.0.1:4173';
export const GV_VIEW = { width: 1280, height: 800 };
export const HV_VIEW = { width: 390, height: 844 };
export const MIN = 60_000;

/* ---------- screens ---------- */

export const T10 = '/gv/bai-thi';
export const T22 = (id: string) => `/gv/bai-thi/${id}`;
export const T22_NEW = '/gv/bai-thi/moi';
export const T16 = (id: string, cls?: string) => `/gv/bai-thi/${id}/ket-qua${cls ? `?lop=${cls}` : ''}`;
export const T14 = (id: string, cls: string, hv: string) => `/gv/bai-nop?thi=${id}&lop=${cls}&hv=${hv}`;
export const S07 = '/hv/bai-thi';
export const S08 = (id: string) => `/hv/bai-thi/${id}`;

/* ---------- sessions ---------- */

async function session(page: Page, data: object) {
  const res = await page.request.post('/api/dev/session', { data, headers: { Origin: ORIGIN } });
  expect(res.status(), await res.text()).toBe(201);
  return res.json();
}

/** A GV page (1280 × 800) of the seeded workspace. */
export async function gvPage(browser: Browser, opts: { timezoneId?: string } = {}) {
  const ctx = await browser.newContext({ viewport: GV_VIEW, baseURL: ORIGIN, ...opts });
  const page = await ctx.newPage();
  await session(page, { role: 'GV' });
  return { ctx, page };
}

/** An HV page (390 × 844 unless given) signed in as `userId`. */
export async function hvPage(
  browser: Browser,
  userId: string,
  opts: { viewport?: { width: number; height: number }; timezoneId?: string } = {},
) {
  const ctx = await browser.newContext({ viewport: opts.viewport ?? HV_VIEW, baseURL: ORIGIN, ...(opts.timezoneId ? { timezoneId: opts.timezoneId } : {}) });
  const page = await ctx.newPage();
  await session(page, { role: 'HV', userId });
  return { ctx, page };
}

/* ---------- 001 / 003 data ---------- */

/** `n` new activated students of the GV's workspace (each test gets HV of its own, so S07 shows only its exams). */
export async function freshStudents(gv: Page, n: number, prefix = 'HV') {
  const tag = uid();
  const ids: string[] = [];
  for (let k = 0; k < n; k++) {
    const s = await api<{ id: string }>(gv, 'POST', '/api/students', {
      displayName: `${prefix} ${k + 1} ${tag}`,
      email: `qa006.${tag}.${k}@sat.dev`,
    });
    await api(gv, 'POST', `/api/students/${s.id}/activate`);
    ids.push(s.id);
  }
  for (const id of ids)
    await expect
      .poll(async () => (await api<any>(gv, 'GET', `/api/students/${id}`)).status, { timeout: 15_000 })
      .toBe('active');
  return ids;
}

/** A student created but never activated ("Chưa kích hoạt"). */
export async function inactiveStudent(gv: Page) {
  const tag = uid();
  return (await api<{ id: string }>(gv, 'POST', '/api/students', { displayName: `Chưa KH ${tag}`, email: `qa006.na.${tag}@sat.dev` })).id;
}

/** VN day `offset` days from the server's today. */
export async function vnDay(page: Page, offset = 0) {
  const now = await serverNow(page);
  return new Date(now.getTime() + 7 * 3600e3 + offset * 86400e3).toISOString().slice(0, 10);
}

/** One curriculum per workspace for the classes of the scripts. */
const curricula = new Map<string, string>();
/** A class of the GV's workspace (name unique), started `startOffset` days from today (> 0 = Sắp bắt đầu). */
export async function newClass(gv: Page, students: string[], opts: { name?: string; startOffset?: number } = {}) {
  const ws = (await api<any>(gv, 'GET', '/api/session')).workspace.id as string;
  if (!curricula.has(ws))
    curricula.set(ws, (await api<{ id: string }>(gv, 'POST', '/api/curricula', { name: `QA 006 ${uid()}`, hsk: 1 })).id);
  const curriculum = curricula.get(ws);
  const name = opts.name ?? `Lớp QA ${uid()}`;
  const c = await api<{ id: string; name: string }>(gv, 'POST', '/api/classes', {
    name,
    startDate: await vnDay(gv, opts.startOffset ?? 0),
    curriculumId: curriculum,
    studentIds: students,
    createKey: `qa006-${uid()}`,
  });
  return { id: c.id, name };
}
export const addToClass = (gv: Page, cls: string, ids: string[]) =>
  api(gv, 'POST', `/api/classes/${cls}/students`, { studentIds: ids });
export const removeFromClass = (gv: Page, cls: string, id: string) => call(gv, 'DELETE', `/api/classes/${cls}/students/${id}`);
export const endClass = (gv: Page, cls: string) => api(gv, 'POST', `/api/classes/${cls}/end`);

/* ---------- time ---------- */

export async function serverNow(page: Page): Promise<Date> {
  const r = await page.request.get('/api/health');
  const date = r.headers()['date'];
  // The exams endpoints carry the exact server time (the dev clock may be moved).
  const ex = await call(page, 'GET', '/api/exams');
  if (ex.status === 200) return new Date(ex.body.serverNow);
  const hv = await call(page, 'GET', '/api/learn/exams');
  if (hv.status === 200) return new Date(hv.body.serverNow);
  return new Date(date ?? Date.now());
}
/** The current server minute (a valid "Giờ mở" now). */
export const minuteOf = (d: Date) => new Date(Math.floor(d.getTime() / MIN) * MIN);
export const advanceClock = (page: Page, ms: number) => api(page, 'POST', '/api/dev/clock', { advanceMs: ms });
export const resetClock = (page: Page) => call(page, 'DELETE', '/api/dev/clock');

/** dd/MM/yyyy HH:mm in Vietnam time (what T22 shows and takes). */
export function vnInput(d: Date) {
  const v = new Date(d.getTime() + 7 * 3600e3).toISOString();
  return `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)} ${v.slice(11, 16)}`;
}
/** HH:mm dd/MM/yyyy in Vietnam time (state lines of S07 / S08). */
export function vnTimeDate(d: Date) {
  const s = vnInput(d);
  return `${s.slice(11)} ${s.slice(0, 10)}`;
}

/* ---------- content ---------- */

/** "E3": MCQ 你好? (Xin chào correct, 1 pt, explanation), matching of 2 pairs (2 pts), write nǐ hǎo → 你好 (1 pt). Total 4. */
export function e3(instructions = '') {
  return {
    instructions,
    stepId: null,
    questions: [
      mcq('你好?', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }], { explanation: '你好 = xin chào' }),
      match('Nối từ với nghĩa', [
        ['你好', 'xin chào'],
        ['谢谢', 'cảm ơn'],
      ]),
      write('Viết chữ Hán', 'nǐ hǎo', ['你好'], 'xin chào'),
    ],
  };
}
/** `n` one-point MCQs. */
export function mcqs(n: number, instructions = '') {
  return {
    instructions,
    stepId: null,
    questions: Array.from({ length: n }, (_, k) => mcq(`Câu ${k + 1}: 你好?`, [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }])),
  };
}

/** Answers for E3 as stored: which questions right (`true`), wrong (`false`) or unanswered (`null`); match may be "half". */
export function e3Answers(content: any, want: { q1?: boolean | null; q2?: boolean | 'half' | null; q3?: boolean | null } = {}) {
  const [q1, q2, q3] = content.questions;
  const a: Record<string, any> = {};
  const w = { q1: true, q2: true, q3: true, ...want };
  if (w.q1 !== null) a[q1.id] = { optionIds: [q1.options.find((o: any) => o.correct === w.q1).id] };
  if (w.q2 !== null) {
    const [p1, p2] = q2.pairs;
    a[q2.id] = {
      pairs:
        w.q2 === true ? { [p1.id]: p1.bId, [p2.id]: p2.bId } : w.q2 === 'half' ? { [p1.id]: p1.bId } : { [p1.id]: p2.bId, [p2.id]: p1.bId },
    };
  }
  if (w.q3 !== null) a[q3.id] = { text: w.q3 ? '你好' : '您好' };
  return a;
}
/** Answer "correct" to every MCQ of `content`. */
export const mcqAnswers = (content: any, right = true) =>
  Object.fromEntries(content.questions.map((q: any) => [q.id, { optionIds: [q.options.find((o: any) => o.correct === right).id] }]));

/* ---------- exams (GV API) ---------- */

export interface ExamOpts {
  name?: string;
  content?: any;
  classIds: string[];
  /** Minutes from the current server minute (0 = open now). */
  openIn?: number;
  dur?: number;
  /** Minutes after the open time. */
  closeAfter?: number;
}
export const examBody = (o: { name: string; content: any; classIds: string[]; opensAt: Date | null; dur: number | null; closesAt: Date | null }) => ({
  name: o.name,
  content: o.content,
  classIds: o.classIds,
  opensAt: o.opensAt?.toISOString() ?? null,
  durationMin: o.dur,
  closesAt: o.closesAt?.toISOString() ?? null,
});

export async function draftExam(gv: Page, o: Partial<ExamOpts> & { opensAt?: Date | null; closesAt?: Date | null } = {}) {
  return api<any>(gv, 'POST', '/api/exams', {
    name: o.name ?? `Bài thi QA ${uid()}`,
    content: o.content ?? e3(),
    classIds: o.classIds ?? [],
    opensAt: o.opensAt?.toISOString() ?? null,
    durationMin: o.dur ?? null,
    closesAt: o.closesAt?.toISOString() ?? null,
  });
}

/** Created and scheduled: open at the current server minute + `openIn`, `dur` minutes, close `closeAfter` minutes after the open. */
export async function scheduledExam(gv: Page, o: ExamOpts) {
  const now = await serverNow(gv);
  const opensAt = new Date(minuteOf(now).getTime() + (o.openIn ?? 0) * MIN);
  const dur = o.dur ?? 45;
  const closesAt = new Date(opensAt.getTime() + (o.closeAfter ?? 60) * MIN);
  const name = o.name ?? `Bài thi QA ${uid()}`;
  const content = o.content ?? e3();
  const d = await draftExam(gv, { name, content, classIds: o.classIds });
  const ex = await api<any>(gv, 'POST', `/api/exams/${d.id}/schedule`, {
    expectedVersion: d.version,
    ...examBody({ name, content, classIds: o.classIds, opensAt, dur, closesAt }),
  });
  return { ...ex, opensAtDate: opensAt, closesAtDate: closesAt };
}
export const getExam = (gv: Page, id: string) => api<any>(gv, 'GET', `/api/exams/${id}`);
/** PUT with the current version and the given changes (any field of the save body). */
export async function saveExam(gv: Page, id: string, changes: Record<string, unknown> = {}) {
  const e = await getExam(gv, id);
  return call(gv, 'PUT', `/api/exams/${id}`, {
    expectedVersion: e.version,
    name: e.name,
    content: e.content,
    classIds: e.classIds,
    opensAt: e.opensAt,
    durationMin: e.durationMin,
    closesAt: e.closesAt,
    ...changes,
  });
}
export const classResults = (gv: Page, id: string, cls: string) => api<any>(gv, 'GET', `/api/exams/${id}/results?classId=${cls}`);
export const feed = async (gv: Page, cls: string) => (await api<any>(gv, 'GET', `/api/exams/results?classId=${cls}`)).items as any[];

/* ---------- HV attempt (S08 API) ---------- */

export const holder = () => `h${uid()}xxxxxxxx`.slice(0, 40);
export const learnList = async (hv: Page) => (await api<any>(hv, 'GET', '/api/learn/exams')).items as any[];
export const learnView = (hv: Page, id: string) => call(hv, 'GET', `/api/learn/exams/${id}`);
export const start = (hv: Page, id: string, h: string) => call(hv, 'POST', `/api/learn/exams/${id}/start`, { holder: h });
export const save = (hv: Page, id: string, h: string, answers: object, lastIndex?: number) =>
  call(hv, 'PUT', `/api/learn/exams/${id}/attempt`, { holder: h, answers, ...(lastIndex === undefined ? {} : { lastIndex }) });
export const submit = (hv: Page, id: string, h: string, answers: object = {}, submitKey = `k${uid()}xxxxxxxx`) =>
  call(hv, 'POST', `/api/learn/exams/${id}/submit`, { holder: h, submitKey, answers });
export const clockOf = (hv: Page, id: string) => api<any>(hv, 'GET', `/api/learn/exams/${id}/clock`);

/** Start, save `answers` (by the stored ids from `content`) and submit. */
export async function takeExam(hv: Page, id: string, answers: (content: any) => object) {
  const h = holder();
  const s = await start(hv, id, h);
  expect(s.status, JSON.stringify(s.body)).toBe(200);
  return { h, attempt: s.body, answers };
}

/** The exam's stored content (with the ids as saved) — the GV's view. */
export const contentOf = async (gv: Page, id: string) => (await getExam(gv, id)).content;

/** Start and submit with E3 answers built from the stored content. */
export async function doExam(gv: Page, hv: Page, id: string, want: Parameters<typeof e3Answers>[1] = {}) {
  const content = await contentOf(gv, id);
  const h = holder();
  const s = await start(hv, id, h);
  expect(s.status, JSON.stringify(s.body)).toBe(200);
  const r = await submit(hv, id, h, e3Answers(content, want));
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return { h, content };
}

/* ---------- HV through the screens ---------- */

/** The S07 card of an exam. */
export const card = (hv: Page, name: string) => hv.locator('article', { has: hv.getByRole('heading', { name }) });

/** S07 → "Vào thi" → lobby → "Bắt đầu làm bài" → S08 with its timer. */
export async function startOnScreen(hv: Page, name: string) {
  await hv.goto(S07);
  await card(hv, name).getByRole('button', { name: 'Vào thi' }).click();
  await hv.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
  await expect(hv.getByRole('timer', { name: 'Thời gian còn lại' })).toBeVisible();
}
/** Seconds shown by the S08 countdown (mm:ss or h:mm:ss). */
export async function timerSeconds(hv: Page) {
  const text = (await hv.getByRole('timer', { name: 'Thời gian còn lại' }).innerText()).trim();
  return text.split(':').map(Number).reduce((s, x) => s * 60 + x, 0);
}

/** S08: go to question `n` through the "Bảng số câu". */
export const goTo = (hv: Page, n: number) =>
  hv.getByRole('navigation', { name: 'Bảng số câu' }).getByRole('button', { name: new RegExp(`^Câu ${n} · `) }).click();
/** S08, E3 on screen: q1 (choice), q2 ('full' | 'half' pairs), q3 (typed Hanzi). */
export async function answerE3(hv: Page, want: { q1?: string; q2?: 'full' | 'half'; q3?: string } = {}) {
  if (want.q1) {
    await goTo(hv, 1);
    await hv.getByRole('button', { name: new RegExp(want.q1) }).or(hv.getByText(want.q1, { exact: true })).first().click();
  }
  if (want.q2) {
    await goTo(hv, 2);
    const pairs = want.q2 === 'full' ? [['你好', 'xin chào'], ['谢谢', 'cảm ơn']] : [['你好', 'xin chào']];
    for (const [a, b] of pairs) {
      await hv.getByRole('group', { name: 'Cột A' }).getByRole('button', { name: a! }).click();
      await hv.getByRole('group', { name: 'Cột B' }).getByRole('button', { name: b! }).click();
    }
  }
  if (want.q3) {
    await goTo(hv, 3);
    await hv.getByRole('textbox').fill(want.q3);
  }
}

/** Load cases: a workspace of its own with `n` students, waiting until all are activated ("Đã kích hoạt"). */
export async function workspaceWithStudentsQuick(browser: Browser, n: number) {
  const ws = await workspaceWithStudents(browser, n);
  await expect
    .poll(async () => (await api<any>(ws.page, 'GET', '/api/students')).counts.active, { timeout: 120_000 })
    .toBe(n);
  return ws;
}

/** A part id of 005's builders, re-used for unique names. */
export const tag = () => pid('t');
