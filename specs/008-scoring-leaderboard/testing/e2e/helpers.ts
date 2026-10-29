/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
// Shared steps of the 008 QA scripts: data set-up through the API exactly as test-cases.md "Dữ liệu và tài khoản dùng chung"
// says (named HV An/Bình/Chi/Dũng/Hà, curriculum "R1", classes, deadlines, submissions with chosen scores, exams "E3"),
// the server clock, and the user's steps on S09 / T04 tab "Xếp hạng". Not a test file.
// Raw API helpers come from 005, exam helpers from 006.
import { type Browser, type BrowserContext, type Locator, type Page, expect, test } from '@playwright/test';
import { api, call, mcq, otherGvPage as otherGv, uid } from '../../../005-exercises/testing/e2e/helpers';
import { MIN, e3, e3Answers, holder, save as saveExamAnswers, scheduledExam, serverNow, start as startExam, submit as submitExam } from '../../../006-exams/testing/e2e/helpers';

export { api, call, evidence, mcq, uid } from '../../../005-exercises/testing/e2e/helpers';
export { MIN, e3, scheduledExam, serverNow } from '../../../006-exams/testing/e2e/helpers';

export const ORIGIN = 'http://127.0.0.1:4173';
export const GV_VIEW = { width: 1280, height: 800 };
export const HV_VIEW = { width: 390, height: 844 };
export const HOUR = 3600_000;
export const DAY = 24 * HOUR;

/* ---------- screens ---------- */

export const S09 = '/hv/xep-hang';
export const S09_OF = (cls: string) => `/hv/xep-hang?lop=${cls}`;
export const T04 = (cls: string) => `/gv/lop-hoc/${cls}`;
export const T04_RANK = (cls: string) => `/gv/lop-hoc/${cls}?tab=xep-hang`;
export const S02 = (cls: string) => `/hv/lop/${cls}`;
export const S06 = (cls: string, set: string) => `/hv/lop/${cls}/bai-tap/${set}/ket-qua`;

/* ---------- sessions ---------- */

async function signIn(page: Page, data: object) {
  const res = await page.request.post('/api/dev/session', { data, headers: { Origin: ORIGIN } });
  expect(res.status(), await res.text()).toBe(201);
  return res.json();
}

/** Contexts opened by this test; `closeOpened` (registered by every script) closes them after it. */
const opened: BrowserContext[] = [];
async function newCtx(browser: Browser, viewport: { width: number; height: number }) {
  const ctx = await browser.newContext({ viewport, baseURL: ORIGIN });
  opened.push(ctx);
  return ctx;
}
/** A GV of a brand-new workspace (005's helper), its context closed after the test like the others. */
export async function otherGvPage(browser: Browser) {
  const gv = await otherGv(browser);
  opened.push(gv.ctx);
  return gv;
}
export async function closeOpened() {
  for (const c of opened.splice(0)) await c.close().catch(() => undefined);
}

/** A GV page (1280 × 800 unless given) of the seeded workspace (Cô Lan). */
export async function gvPage(browser: Browser, viewport = GV_VIEW) {
  const ctx = await newCtx(browser, viewport);
  const page = await ctx.newPage();
  await signIn(page, { role: 'GV' });
  return { ctx, page };
}

/** An HV page (390 × 844 unless given) signed in as `userId`. */
export async function hvPage(browser: Browser, userId: string, viewport = HV_VIEW) {
  const ctx = await newCtx(browser, viewport);
  const page = await ctx.newPage();
  await signIn(page, { role: 'HV', userId });
  return { ctx, page };
}

/** Signs the page's context in again (the GV session expires after 8 h of a moved clock). */
export const relogin = (page: Page, role: 'GV' | 'HV', userId?: string) =>
  signIn(page, userId ? { role, userId } : { role });

/* ---------- 001: the named students of the test cases ---------- */

export const NAMES = {
  An: 'Nguyễn Văn An',
  Bình: 'Trần Thị Bình',
  Chi: 'Phạm Thu Chi',
  Dũng: 'Lê Văn Dũng',
  Hà: 'Phạm Thu Hà',
} as const;
export type Who = keyof typeof NAMES;
const ASCII: Record<Who, string> = { An: 'an', Bình: 'binh', Chi: 'chi', Dũng: 'dung', Hà: 'ha' };

/** Creates (and by default activates) one student; `email` defaults to `<tên>+<số>@sat.dev`. */
export async function student(gv: Page, displayName: string, opts: { email?: string; activate?: boolean } = {}) {
  const email = opts.email ?? `qa008+${uid()}@sat.dev`;
  const s = await api<{ id: string }>(gv, 'POST', '/api/students', { displayName, email });
  if (opts.activate !== false) {
    await api(gv, 'POST', `/api/students/${s.id}/activate`);
    await expect.poll(async () => (await api<any>(gv, 'GET', `/api/students/${s.id}`)).status, { timeout: 15_000 }).toBe('active');
  }
  return s.id;
}

/** New activated students named An / Bình / … (fresh for each test). */
export async function people<W extends Who>(gv: Page, who: readonly W[]): Promise<Record<W, string>> {
  const out = {} as Record<W, string>;
  for (const w of who) out[w] = await student(gv, NAMES[w], { email: `${ASCII[w]}+${uid()}@sat.dev` });
  return out;
}

export const lockStudent = (gv: Page, id: string) => api(gv, 'POST', `/api/students/${id}/lock`);
export const activate = (gv: Page, id: string) => api(gv, 'POST', `/api/students/${id}/activate`);

/* ---------- 002: curriculum "R1" ---------- */

/** One MCQ worth 1 point, answer "Xin chào" (A). */
const oneQ = () => ({ instructions: '', stepId: null, questions: [mcq('你好?', [{ text: 'Xin chào', correct: true }, { text: 'Tạm biệt' }])] });
/** Two MCQs of 1 point, both with A correct (TC-014, TC-015, TC-017). */
export const twoQ = () => ({
  instructions: '',
  stepId: null,
  questions: [
    mcq('Câu 1: 你好?', [{ text: 'A. Xin chào', correct: true }, { text: 'B. Tạm biệt' }]),
    mcq('Câu 2: 谢谢?', [{ text: 'A. Cảm ơn', correct: true }, { text: 'B. Xin lỗi' }]),
  ],
});

export const SET_KEYS = ['S1a', 'S1b', 'S2a', 'S2b', 'S3a', 'S3b', 'S4a'] as const;
export type SetKey = (typeof SET_KEYS)[number];
export const LESSONS = ['Bài 1 – 你好', 'Bài 2 – 谢谢', 'Bài 3 – 再见', 'Bài 4 – 学习 xuéxí'] as const;
const PLAN: { lesson: number; key: SetKey; title: string }[] = [
  { lesson: 0, key: 'S1a', title: 'Luyện từ mới' },
  { lesson: 0, key: 'S1b', title: 'Luyện mẫu câu' },
  { lesson: 1, key: 'S2a', title: 'Luyện từ mới' },
  { lesson: 1, key: 'S2b', title: 'Đọc hiểu' },
  { lesson: 2, key: 'S3a', title: 'Luyện từ mới' },
  { lesson: 2, key: 'S3b', title: 'Luyện mẫu câu' },
  { lesson: 3, key: 'S4a', title: 'Luyện ngữ pháp' },
];
export const TITLE: Record<SetKey, string> = Object.fromEntries(PLAN.map((p) => [p.key, p.title])) as Record<SetKey, string>;

export interface R1 {
  cur: string;
  lessons: string[];
  sets: Record<SetKey, string>;
  content: Record<SetKey, any>;
  /** Bài 4: one step with a vocabulary deck (004). */
  step4: string;
  deck4: string;
}

async function itemVersion(gv: Page, lesson: string, item: string): Promise<number> {
  const l = await api<any>(gv, 'GET', `/api/lessons/${lesson}`);
  return l.items.find((i: any) => i.id === item).version;
}

/** "R1": 4 published Bài, 7 published sets (1 MCQ each unless `twoQ` names them), Bài 4 with a step + deck. */
export async function r1(gv: Page, opts: { twoQ?: SetKey[] } = {}): Promise<R1> {
  const cur = (await api<{ id: string }>(gv, 'POST', '/api/curricula', { name: `QA 008 GT ${uid()}`, hsk: 1 })).id;
  const lessons: string[] = [];
  for (const name of LESSONS) lessons.push((await api<{ id: string }>(gv, 'POST', `/api/curricula/${cur}/lessons`, { name })).id);
  // Bài 4: step (a text block + "Từ mới" deck of 2 cards) first, then its set.
  const step4 = (await api<{ itemId: string }>(gv, 'POST', `/api/lessons/${lessons[3]}/items`, { section: 'lesson' })).itemId;
  const deck4 = 'k';
  await api(gv, 'POST', `/api/lessons/${lessons[3]}/items/${step4}/publish`, {
    expectedVersion: await itemVersion(gv, lessons[3]!, step4),
    title: 'Học từ 学习',
    content: {
      goal: '',
      blocks: [
        { id: 't', type: 'text', html: '<p>学习 xuéxí = học</p>' },
        { id: deck4, type: 'deck', name: 'Từ mới', cards: [{ id: 'c1', front: '学习', pinyin: 'xuéxí', meaning: 'học' }, { id: 'c2', front: '老师', pinyin: 'lǎoshī', meaning: 'giáo viên' }] },
      ],
    },
  });
  const sets = {} as Record<SetKey, string>;
  const content = {} as Record<SetKey, any>;
  for (const p of PLAN) {
    const lesson = lessons[p.lesson]!;
    const id = (await api<{ itemId: string }>(gv, 'POST', `/api/lessons/${lesson}/items`, { section: 'exercise' })).itemId;
    const c = opts.twoQ?.includes(p.key) ? twoQ() : oneQ();
    await api(gv, 'POST', `/api/lessons/${lesson}/items/${id}/publish`, { expectedVersion: await itemVersion(gv, lesson, id), title: p.title, content: c });
    sets[p.key] = id;
    content[p.key] = c;
  }
  for (const l of lessons) {
    const les = await api<any>(gv, 'GET', `/api/lessons/${l}`);
    await api(gv, 'POST', `/api/lessons/${l}/publish`, { expectedVersion: les.version, itemIds: [] });
  }
  return { cur, lessons, sets, content, step4, deck4 };
}

/** The lesson of a set in R1. */
export const lessonOf = (r: R1, key: SetKey) => r.lessons[Number(key[1]) - 1]!;

async function setItem(gv: Page, r: R1, key: SetKey) {
  const l = await api<any>(gv, 'GET', `/api/lessons/${lessonOf(r, key)}`);
  return l.items.find((i: any) => i.id === r.sets[key]);
}
/** Archive / restore a set (002). */
export async function archiveSet(gv: Page, r: R1, key: SetKey, restore = false) {
  const it = await setItem(gv, r, key);
  return api(gv, 'POST', `/api/lessons/${lessonOf(r, key)}/items/${r.sets[key]}/${restore ? 'restore' : 'archive'}`, { expectedVersion: it.version });
}
/** Changes the answer key of question `q` (0-based) to option `opt` and confirms the re-grade (005). */
export async function regrade(gv: Page, r: R1, key: SetKey, q: number, opt: number) {
  const it = await setItem(gv, r, key);
  const edited = structuredClone(it.content);
  edited.questions[q].options.forEach((o: any, k: number) => (o.correct = k === opt));
  return api(gv, 'PUT', `/api/lessons/${lessonOf(r, key)}/items/${r.sets[key]}`, {
    expectedVersion: it.version,
    title: it.title,
    content: edited,
    confirmRegrade: true,
  });
}

/* ---------- 003: classes, deadlines, visibility ---------- */

/** VN day `offset` days from the server's today (the dev clock may be moved). */
export async function vnDay(page: Page, offset = 0) {
  const now = await serverNow(page);
  return new Date(now.getTime() + 7 * HOUR + offset * DAY).toISOString().slice(0, 10);
}

export async function newClass(gv: Page, cur: string, studentIds: string[], opts: { name?: string; startOffset?: number; startDate?: string } = {}) {
  const name = opts.name ?? `QA 008 Lớp ${uid()}`;
  const c = await api<{ id: string }>(gv, 'POST', '/api/classes', {
    name,
    startDate: opts.startDate ?? (await vnDay(gv, opts.startOffset ?? 0)),
    curriculumId: cur,
    studentIds,
    createKey: crypto.randomUUID(),
  });
  return { id: c.id, name };
}
export const addToClass = (gv: Page, cls: string, ids: string[]) => api(gv, 'POST', `/api/classes/${cls}/students`, { studentIds: ids });
export const removeFromClass = (gv: Page, cls: string, id: string) => api(gv, 'DELETE', `/api/classes/${cls}/students/${id}`);
export const endClass = (gv: Page, cls: string) => api(gv, 'POST', `/api/classes/${cls}/end`);

/** Hạn nộp of a set: `offset` days from the server's today, or `null` to remove it. */
export async function deadline(gv: Page, cls: string, setId: string, offset: number | null = 0) {
  return api(gv, 'PUT', `/api/classes/${cls}/deadlines`, { target: { setId }, date: offset === null ? null : await vnDay(gv, offset) });
}
export async function deadlines(gv: Page, cls: string, r: R1, keys: SetKey[], offset = 0) {
  for (const k of keys) await deadline(gv, cls, r.sets[k], offset);
}
export const hideExercises = (gv: Page, cls: string, lesson: string, hidden = true) =>
  api(gv, 'PUT', `/api/classes/${cls}/visibility`, { hidden, scope: { kind: 'section', lessonId: lesson, section: 'exercise' } });

/* ---------- 005 / 006: submissions ---------- */

/** A submission of a set with a chosen score (dev stand-in, same rules as 005). */
export const devSubmit = (hv: Page, cls: string, setId: string, score: number, maxScore: number) =>
  call(hv, 'POST', `/api/dev/classes/${cls}/sets/${setId}/submit`, { score, maxScore });
export async function submitScore(hv: Page, cls: string, setId: string, score: number, maxScore: number) {
  const r = await devSubmit(hv, cls, setId, score, maxScore);
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return r.body;
}

/** A real 005 submission choosing option `picks[k]` (0 = A, 1 = B) for question k of the set's content. */
export async function realSubmit(hv: Page, cls: string, setId: string, content: any, picks: number[]) {
  const base = `/api/learn/classes/${cls}/sets/${setId}`;
  const s = await call(hv, 'POST', `${base}/start`);
  expect(s.status, JSON.stringify(s.body)).toBeLessThan(300);
  const answers = Object.fromEntries(content.questions.map((q: any, k: number) => [q.id, { optionIds: [q.options[picks[k] ?? 0].id] }]));
  const r = await call(hv, 'POST', `${base}/submit`, { submitKey: crypto.randomUUID(), answers });
  expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
  return r.body;
}

/** Exam "E3" assigned to `classIds`, open at the current server minute + `openIn`, closing `closeAfter` min after. */
export async function exam(gv: Page, classIds: string[], o: { name?: string; openIn?: number; closeAfter?: number; dur?: number } = {}) {
  return scheduledExam(gv, { name: o.name ?? `QA 008 Bài thi ${uid()}`, classIds, content: e3(), openIn: o.openIn ?? 0, closeAfter: o.closeAfter ?? 60, dur: o.dur ?? 45 });
}
const examContent = async (gv: Page, id: string) => (await api<any>(gv, 'GET', `/api/exams/${id}`)).content;
/** HV takes E3: 'three' = 3/4 (Câu 1 + Câu 2 right), 'one' = 1/4 (only Câu 1). */
export async function takeExam(gv: Page, hv: Page, id: string, result: 'three' | 'one' | 'four' = 'three') {
  const content = await examContent(gv, id);
  const want = result === 'three' ? { q3: false } : result === 'one' ? { q2: false as const, q3: false } : {};
  const h = holder();
  const s = await startExam(hv, id, h);
  expect(s.status, JSON.stringify(s.body)).toBe(200);
  const r = await submitExam(hv, id, h, e3Answers(content, want));
  expect(r.status, JSON.stringify(r.body)).toBe(200);
}
/** HV starts E3 and saves Câu 1 + Câu 2 right without submitting. */
export async function startAndSaveExam(gv: Page, hv: Page, id: string) {
  const content = await examContent(gv, id);
  const h = holder();
  expect((await startExam(hv, id, h)).status).toBe(200);
  const r = await saveExamAnswers(hv, id, h, e3Answers(content, { q3: null }));
  expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
}
export const archiveExam = (gv: Page, id: string) => api(gv, 'POST', `/api/exams/${id}/archive`);

/* ---------- clock ---------- */

export const advanceClock = (page: Page, ms: number) => api(page, 'POST', '/api/dev/clock', { advanceMs: ms });
export const resetClock = (page: Page) => call(page, 'DELETE', '/api/dev/clock');
/** Moves the server clock to one minute after `closesAt` and lets 006 settle the exam (10 s). */
export async function pastClose(page: Page, closesAt: Date) {
  const now = await serverNow(page);
  await advanceClock(page, closesAt.getTime() - now.getTime() + MIN);
}

/* ---------- 008 API (data sent to the device) ---------- */

export const learnRanking = (hv: Page, cls: string) => api<any>(hv, 'GET', `/api/learn/ranking/${cls}`);
export const classRanking = (gv: Page, cls: string) => api<any>(gv, 'GET', `/api/classes/${cls}/ranking`);

/* ---------- S09 (HV) ---------- */

/** S01 → bottom tab "Xếp hạng" → S09 (class chosen in the picker when given and the picker is shown). */
export async function openS09(hv: Page, cls?: string) {
  await hv.goto('/hv');
  await hv.getByRole('link', { name: 'Xếp hạng' }).first().click();
  await expect(hv.locator('[data-screen="S09"]')).toBeVisible();
  if (cls) {
    const picker = hv.getByRole('combobox', { name: 'Chọn lớp' });
    if (await picker.isVisible().catch(() => false)) await picker.selectOption(cls);
  }
  await settle(hv);
}
/** Waits until S09 / T04 has finished loading (no skeleton, "Làm mới" enabled). */
export async function settle(page: Page) {
  await expect(page.getByRole('button', { name: 'Làm mới' })).toBeEnabled({ timeout: 15_000 });
  await expect(page.locator('.skeleton, [class*="skeleton"]')).toHaveCount(0);
}
export async function myScore(hv: Page) {
  await hv.getByRole('radio', { name: 'Điểm của tôi' }).click();
  await expect(summary(hv)).toBeVisible();
}
export async function rankingSeg(hv: Page) {
  await hv.getByRole('radio', { name: 'Xếp hạng' }).click();
}
export async function refresh(page: Page) {
  await page.getByRole('button', { name: 'Làm mới' }).click();
  await settle(page);
}
export const summary = (hv: Page) => hv.getByRole('region', { name: 'Tóm tắt Điểm của tôi' });
/** A summary cell ("TB bài tập", "TB bài thi", "Bộ bài tập đã nộp"). */
export const cell = (hv: Page, label: string) => summary(hv).locator('.rk-cell', { has: hv.getByText(label, { exact: true }) });
/** The big Điểm xếp hạng of "Điểm của tôi". */
export const bigScore = (hv: Page) => summary(hv).locator('.rk-hero__big');
/** Section of one Bài in the "Bài tập" group. */
export const lessonGroup = (hv: Page, lesson: string) => hv.getByRole('region', { name: lesson, exact: true });
/** The row of a set (title) inside a Bài group. */
export const setRow = (hv: Page, lesson: string, title: string) =>
  lessonGroup(hv, lesson).locator('.rk-row', { has: hv.locator('.rk-row__title', { hasText: new RegExp(`^${title}$`) }) });
/** The row of an exam (name) in the "Bài thi" group. */
export const examRow = (hv: Page, name: string) =>
  hv.locator('.rk-mine > .rk-row', { has: hv.locator('.rk-row__title', { hasText: name }) });

/** Checks the "Điểm của tôi" summary. */
export async function expectSummary(
  hv: Page,
  s: { score?: string; rank?: string; avgEx?: string; nEx?: number; avgExam?: string; nExam?: number; submitted?: string; formula?: string },
) {
  if (s.score !== undefined) await expect(bigScore(hv)).toHaveText(s.score);
  if (s.rank !== undefined) await expect(summary(hv).locator('.rk-hero__rank')).toHaveText(s.rank);
  if (s.avgEx !== undefined) await expect(cell(hv, 'TB bài tập').locator('.rk-cell__v')).toHaveText(s.avgEx);
  if (s.nEx !== undefined) await expect(cell(hv, 'TB bài tập')).toContainText(`${s.nEx} bộ được tính`);
  if (s.avgExam !== undefined) await expect(cell(hv, 'TB bài thi').locator('.rk-cell__v')).toHaveText(s.avgExam);
  if (s.nExam !== undefined) await expect(cell(hv, 'TB bài thi')).toContainText(`${s.nExam} bài thi được tính`);
  if (s.submitted !== undefined) await expect(cell(hv, 'Bộ bài tập đã nộp').locator('.rk-cell__v')).toHaveText(s.submitted);
  if (s.formula !== undefined) await expect(summary(hv)).toContainText(s.formula);
}

/** Board rows of S09 "Xếp hạng" in order: podium (1, 2, 3 by rank) then list rows → `{ name, rank, score }`. */
export async function boardRows(hv: Page) {
  const out: { name: string; rank: string; score: string }[] = [];
  const pods = hv.locator('.rk-pod');
  const n = await pods.count();
  const podRows: { name: string; rank: string; score: string; k: number }[] = [];
  for (let i = 0; i < n; i++) {
    const p = pods.nth(i);
    const cls = (await p.getAttribute('class')) ?? '';
    const k = Number(/rk-pod--(\d)/.exec(cls)?.[1] ?? 0);
    podRows.push({
      k,
      name: (await p.locator('.rk-pod__name').innerText()).replace(/ \(bạn\)$/, '').trim(),
      rank: (await p.locator('.rk-no').innerText()).split('\n')[0]!.replace(/\D.*$/, '').trim(),
      score: (await p.locator('.rk-pod__pts').innerText()).replace(' điểm', '').trim(),
    });
  }
  podRows.sort((a, b) => a.k - b.k);
  out.push(...podRows.map(({ k: _k, ...r }) => r));
  const rows = hv.locator('.rk-lrow');
  for (let i = 0; i < (await rows.count()); i++) {
    const r = rows.nth(i);
    out.push({
      name: (await r.locator('.rk-lrow__name').innerText()).replace(/\s*Bạn$/, '').trim(),
      rank: (await r.locator('.rk-no').innerText()).replace(/\D.*$/s, '').trim(),
      score: (await r.locator('.rk-lrow__pts').innerText()).trim(),
    });
  }
  return out;
}
export const pin = (hv: Page) => hv.getByRole('link', { name: 'Vị trí của tôi' });

/* ---------- T04 tab "Xếp hạng" (GV) ---------- */

/** T04 → tab "Xếp hạng". */
export async function openRankingTab(gv: Page, cls: string) {
  await gv.goto(T04(cls));
  await gv.getByRole('tab', { name: 'Xếp hạng' }).click();
  await expect(gv.locator('[data-screen="T04-xep-hang"]')).toBeVisible();
  await settle(gv);
}
/** Table rows of the tab in order → cells by column. */
export async function tableRows(gv: Page) {
  const rows = gv.locator('.rk-tbl > tbody > tr:not(.rk-tbl__detail)');
  const out: { rank: string; name: string; locked: boolean; email: string; avgEx: string; avgExam: string; score: string; updated: string }[] = [];
  for (let i = 0; i < (await rows.count()); i++) {
    const td = rows.nth(i).locator(':scope > td');
    out.push({
      rank: (await td.nth(0).innerText()).replace(/\D.*$/s, '').trim() || '—',
      name: (await td.nth(1).locator('.strong').innerText()).trim(),
      locked: (await td.nth(1).getByText('Đã khóa').count()) > 0,
      email: (await td.nth(2).innerText()).trim(),
      avgEx: (await td.nth(3).innerText()).trim(),
      avgExam: (await td.nth(4).innerText()).trim(),
      score: (await td.nth(5).innerText()).trim(),
      updated: (await td.nth(6).innerText()).trim(),
    });
  }
  return out;
}
export const tableRow = (gv: Page, name: string): Locator =>
  gv.locator('.rk-tbl > tbody > tr', { has: gv.locator('.strong', { hasText: new RegExp(`^${name}$`) }) });

/* ---------- misc ---------- */

/** dd/MM/yyyy HH:mm in Vietnam time. */
export function vnDateTime(d: Date) {
  const v = new Date(d.getTime() + 7 * HOUR).toISOString();
  return `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)} ${v.slice(11, 16)}`;
}
/** dd/MM/yyyy of a YYYY-MM-DD day. */
export const ddmmyyyy = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

/* ---------- TC-016 data: An, Dũng; S1a, S3a, S3b due today; An 9/10, 10/10, 3/4; Dũng 6/10, 8/10; +24 h ---------- */

export async function tc016Data(browser: Browser, gv: Page, opts: { twoQ?: SetKey[]; anS3aReal?: boolean; skipClock?: boolean } = {}) {
  const ids = await people(gv, ['An', 'Dũng']);
  const r = await r1(gv, { twoQ: opts.twoQ });
  const A = await newClass(gv, r.cur, [ids.An, ids.Dũng]);
  await deadlines(gv, A.id, r, ['S1a', 'S3a', 'S3b']);
  const an = await hvPage(browser, ids.An);
  const dung = await hvPage(browser, ids.Dũng);
  await submitScore(an.page, A.id, r.sets.S1a, 9, 10);
  if (opts.anS3aReal) await realSubmit(an.page, A.id, r.sets.S3a, r.content.S3a, [0, 0]);
  else await submitScore(an.page, A.id, r.sets.S3a, 10, 10);
  await submitScore(an.page, A.id, r.sets.S3b, 3, 4);
  await submitScore(dung.page, A.id, r.sets.S1a, 6, 10);
  await submitScore(dung.page, A.id, r.sets.S3a, 8, 10);
  if (!opts.skipClock) {
    await advanceClock(gv, DAY);
    await relogin(gv, 'GV');
  }
  return { ...ids, r, A, an: an.page, dung: dung.page };
}

/* ---------- TC-029 data: An 9, Bình 8, Chi 8, Dũng 7 of 10 on S1a (submitted in that order) ---------- */

export async function tc029Data(browser: Browser, gv: Page, opts: { dungName?: string; extraDeadlines?: SetKey[] } = {}) {
  const ids = await people(gv, ['An', 'Bình', 'Chi']);
  const Dũng = await student(gv, opts.dungName ?? NAMES.Dũng, { email: `dung+${uid()}@sat.dev` });
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [ids.An, ids.Bình, ids.Chi, Dũng]);
  await deadlines(gv, A.id, r, ['S1a', ...(opts.extraDeadlines ?? [])]);
  const pages = {} as Record<Who, Page>;
  for (const [w, id, s] of [['An', ids.An, 9], ['Bình', ids.Bình, 8], ['Chi', ids.Chi, 8], ['Dũng', Dũng, 7]] as const) {
    pages[w] = (await hvPage(browser, id)).page;
    await submitScore(pages[w], A.id, r.sets.S1a, s, 10);
  }
  return { ...ids, Dũng, r, A, pages };
}

/* ---------- TC-034 data: 12 activated + 1 "Chưa kích hoạt"; S1a due today; HV k scores 100 − 5k ---------- */

export async function tc034Data(browser: Browser, gv: Page) {
  const tag = uid();
  const names = Array.from({ length: 12 }, (_, k) => `Học viên ${String.fromCharCode(65 + k)} ${tag}`);
  const ids: string[] = [];
  for (const [k, n] of names.entries()) ids.push(await student(gv, n, { email: `hv${k + 1}+${tag}@sat.dev` }));
  const inactive = await student(gv, `Chưa kích hoạt ${tag}`, { activate: false });
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [...ids, inactive]);
  await deadline(gv, A.id, r.sets.S1a);
  const pages: Page[] = [];
  for (const [k, id] of ids.entries()) {
    const p = (await hvPage(browser, id)).page;
    pages.push(p);
    await submitScore(p, A.id, r.sets.S1a, 100 - 5 * (k + 1), 100);
  }
  return { ids, names, inactive, r, A, pages };
}

/* ---------- TC-038 data: An in P (Đang học since 01/10), Q (Đang học since today), R (Sắp bắt đầu), S (Đã kết thúc) ---------- */

export async function tc038Data(browser: Browser, gv: Page) {
  const { An } = await people(gv, ['An']);
  const r = await r1(gv);
  const t = uid();
  const today = await vnDay(gv);
  const P = await newClass(gv, r.cur, [An], { name: `TC P ${t}`, startDate: `${today.slice(0, 8)}01` });
  const Q = await newClass(gv, r.cur, [An], { name: `TC Q ${t}` });
  const R = await newClass(gv, r.cur, [An], { name: `TC R ${t}`, startOffset: 3 });
  const S = await newClass(gv, r.cur, [An], { name: `TC S ${t}`, startOffset: -2 });
  await endClass(gv, S.id);
  const an = (await hvPage(browser, An)).page;
  return { An, r, P, Q, R, S, an };
}

/* ---------- TC-057 data: An in A; X closed yesterday (An no-show), Y open (closes in 60 min), Z opens tomorrow;
   W closed before Chi was added ---------- */

export async function tc057Data(browser: Browser, gv: Page) {
  const { An, Chi } = await people(gv, ['An', 'Chi']);
  const r = await r1(gv);
  const A = await newClass(gv, r.cur, [An]);
  const t = uid();
  const X = await exam(gv, [A.id], { name: `TC-057 X ${t}` });
  const W = await exam(gv, [A.id], { name: `TC-057 W ${t}`, closeAfter: 30, dur: 20 });
  // X and W close; one day later: Y open now, Z opening tomorrow, then Chi joins.
  await advanceClock(gv, DAY + 2 * HOUR);
  await relogin(gv, 'GV');
  const Y = await exam(gv, [A.id], { name: `TC-057 Y ${t}` });
  const Z = await exam(gv, [A.id], { name: `TC-057 Z ${t}`, openIn: 24 * 60 });
  await addToClass(gv, A.id, [Chi]);
  const an = (await hvPage(browser, An)).page;
  const chi = (await hvPage(browser, Chi)).page;
  /** "HH:mm dd/mm/yyyy" as the row shows the close time. */
  const close = (d: Date) => {
    const s = vnDateTime(d);
    return `${s.slice(11)} ${s.slice(0, 10)}`;
  };
  return { An, Chi, r, A, X, W, Y, Z, an, chi, close };
}

/** Scripts that move the server clock call this at top level: the clock goes back to real time after each test. */
export function useClockReset() {
  test.afterEach(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: ORIGIN });
    const page = await ctx.newPage();
    await signIn(page, { role: 'GV' });
    await resetClock(page);
    await ctx.close();
  });
}

export async function closeAll(...ctxs: BrowserContext[]) {
  for (const c of ctxs) await c.close().catch(() => undefined);
}
