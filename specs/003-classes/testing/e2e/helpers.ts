// Shared preconditions for the 003 QA scripts (TC-###.spec.ts): API calls a test case's "Tiền điều kiện" allows,
// sign-ins as a given user, dev stand-ins of 005 / 006, the server clock and evidence screenshots. Not a test file.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { type APIRequestContext, type Locator, type Page, expect, request } from '@playwright/test';

export const ORIGIN = `http://127.0.0.1:${process.env.PORT ?? '4173'}`;
export const uid = (): string => Math.random().toString(36).slice(2, 7);
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Api = APIRequestContext;

export const READY_STEP = { blocks: [{ type: 'text', text: '你好 nǐ hǎo — Xin chào' }] };
export const setContent = (questions = 1) => ({
  questions: Array.from({ length: questions }, (_, i) => ({
    type: 'mcq',
    prompt: `Câu ${i + 1}: 你好?`,
    options: ['Xin chào', 'Tạm biệt'],
    answer: 0,
  })),
});

/* ---------- days (Vietnam time, server clock = real clock unless moved) ---------- */

const DAY = 24 * 3600_000;
export const vnDay = (ms = Date.now()) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);
export const addDays = (day: string, n: number) =>
  vnDay(Date.parse(`${day}T00:00:00+07:00`) + n * DAY);
export const ddmmyyyy = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
export const ddmm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/* ---------- API ---------- */

export async function call(api: Api, method: string, path: string, data?: unknown) {
  const res = await api.fetch(`/api${path}`, {
    method,
    ...(data === undefined ? {} : { data }),
    headers: { Origin: ORIGIN },
  });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status(), body };
}

export async function ok(api: Api, method: string, path: string, data?: unknown): Promise<any> {
  const r = await call(api, method, path, data);
  if (r.status >= 300) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

/** A separate API client signed in as the seed GV, an HV (by id) or a fresh GV of a new workspace. */
export async function apiAs(role: 'GV' | 'HV', userId?: string): Promise<Api> {
  const api = await request.newContext({ baseURL: ORIGIN });
  await ok(api, 'POST', '/dev/session', { role, ...(userId ? { userId } : {}) });
  return api;
}

export async function newWorkspaceGv(): Promise<Api> {
  const api = await request.newContext({ baseURL: ORIGIN });
  await api.delete('/api/dev/throttles', { headers: { Origin: ORIGIN } });
  await ok(api, 'POST', '/auth/register', {
    displayName: 'Cô Bình',
    email: `gvb+${Date.now()}${uid()}@sat.dev`,
    password: 'Binh2026x',
    passwordConfirm: 'Binh2026x',
  });
  return api;
}

/** Signs `page`'s browser in (the session cookie of its context), as the dev sign-in precondition. */
export async function signIn(page: Page, role: 'GV' | 'HV', userId?: string): Promise<void> {
  // Let the signed-out app settle first (it redirects to A01), so that redirect cannot land after the next navigation.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const res = await page.request.post('/api/dev/session', {
    data: { role, ...(userId ? { userId } : {}) },
    headers: { Origin: ORIGIN },
  });
  if (res.status() !== 201) throw new Error(`sign-in ${role} → ${res.status()}`);
  const check = await page.request.get('/api/session');
  if (check.status() !== 200) throw new Error(`sign-in ${role}: session → ${check.status()}`);
}

/** Signs the page in as the same user as an API client (dev sign-in by user id). */
export async function signInLike(page: Page, api: Api): Promise<void> {
  const me = await ok(api, 'GET', '/session');
  await signIn(page, me.user.role, me.user.id);
  const check = await page.request.get('/api/session');
  if (check.status() !== 200) throw new Error(`browser sign-in as ${me.user.id} → ${check.status()}`);
}

/* ---------- students (001) ---------- */

export async function studentByEmail(gv: Api, email: string): Promise<any> {
  const res = await ok(gv, 'GET', `/students?q=${encodeURIComponent(email)}`);
  const s = res.items.find((x: any) => x.email === email);
  if (!s) throw new Error(`no student ${email}`);
  return s;
}

/** A new HV ("Chưa kích hoạt"); `activate` waits until "Đã kích hoạt", `lock` locks after activation. */
export async function newStudent(
  gv: Api,
  displayName: string,
  opts: { activate?: boolean; lock?: boolean; email?: string } = {},
): Promise<{ id: string; email: string; displayName: string }> {
  const email = opts.email ?? `hv+${Date.now()}${uid()}@sat.dev`;
  const s = await ok(gv, 'POST', '/students', { displayName, email });
  if (opts.activate || opts.lock) {
    await ok(gv, 'POST', `/students/${s.id}/activate`, {});
    await expect
      .poll(async () => (await ok(gv, 'GET', `/students/${s.id}`)).status, { timeout: 20_000 })
      .toBe(opts.email?.endsWith('.invalid') ? 'failed' : 'active');
  }
  if (opts.lock) await ok(gv, 'POST', `/students/${s.id}/lock`, {});
  return { id: s.id, email, displayName };
}

/* ---------- curriculum (002) ---------- */

export interface SeedLesson {
  name: string;
  steps?: number;
  sets?: number;
  /** Bài stays Nháp (its items are published). */
  draft?: boolean;
  /** Extra items left Nháp. */
  draftSets?: number;
  questions?: number;
}
export interface SeededLesson {
  id: string;
  name: string;
  steps: string[];
  sets: string[];
  draftSets: string[];
}

async function addItem(gv: Api, lessonId: string, section: 'lesson' | 'exercise', title: string, publish: boolean, questions = 1) {
  const { itemId, lesson } = await ok(gv, 'POST', `/lessons/${lessonId}/items`, { section });
  const item = lesson.items.find((i: any) => i.id === itemId);
  await ok(gv, publish ? 'POST' : 'PUT', `/lessons/${lessonId}/items/${itemId}${publish ? '/publish' : ''}`, {
    expectedVersion: item.version,
    title,
    content: section === 'lesson' ? READY_STEP : setContent(questions),
  });
  return itemId as string;
}

/** A curriculum with Bài of published steps / sets (Bài published unless `draft`). */
export async function seedCurriculum(
  gv: Api,
  name: string,
  lessons: SeedLesson[],
  hsk = 1,
): Promise<{ id: string; name: string; lessons: SeededLesson[] }> {
  const c = await ok(gv, 'POST', '/curricula', { name, hsk });
  const out: SeededLesson[] = [];
  for (const l of lessons) {
    const lesson = await ok(gv, 'POST', `/curricula/${c.id}/lessons`, { name: l.name });
    const steps: string[] = [];
    const sets: string[] = [];
    const draftSets: string[] = [];
    for (let i = 0; i < (l.steps ?? 0); i++)
      steps.push(await addItem(gv, lesson.id, 'lesson', `${l.name} · Bước ${i + 1}`, true));
    for (let i = 0; i < (l.sets ?? 0); i++)
      sets.push(await addItem(gv, lesson.id, 'exercise', `${l.name} · Bộ ${i + 1}`, true, l.questions));
    for (let i = 0; i < (l.draftSets ?? 0); i++)
      draftSets.push(await addItem(gv, lesson.id, 'exercise', `${l.name} · Bộ nháp ${i + 1}`, false));
    if (!l.draft) {
      const fresh = await ok(gv, 'GET', `/lessons/${lesson.id}`);
      await ok(gv, 'POST', `/lessons/${lesson.id}/publish`, { expectedVersion: fresh.version, itemIds: [] });
    }
    out.push({ id: lesson.id, name: l.name, steps, sets, draftSets });
  }
  return { id: c.id, name, lessons: out };
}

/* ---------- classes (003) ---------- */

export const createClass = (
  gv: Api,
  opts: { name: string; curriculumId: string; studentIds?: string[]; startDate?: string; schedule?: string; description?: string },
) =>
  ok(gv, 'POST', '/classes', {
    name: opts.name,
    curriculumId: opts.curriculumId,
    studentIds: opts.studentIds ?? [],
    startDate: opts.startDate ?? vnDay(),
    schedule: opts.schedule ?? '',
    description: opts.description ?? '',
    createKey: `qa-${Date.now()}-${uid()}-${uid()}`,
  });

export const setDeadline = (gv: Api, classId: string, setId: string, date: string | null) =>
  ok(gv, 'PUT', `/classes/${classId}/deadlines`, { target: { setId }, date });

export const setVisibility = (gv: Api, classId: string, hidden: boolean, scope: any) =>
  ok(gv, 'PUT', `/classes/${classId}/visibility`, { hidden, scope });

/** 005 stand-in through 003's gate (HV client). */
export const hvSave = (hv: Api, classId: string, setId: string) =>
  call(hv, 'POST', `/dev/classes/${classId}/sets/${setId}/save`, {});
export const hvSubmit = (hv: Api, classId: string, setId: string, score?: number, maxScore?: number) =>
  call(hv, 'POST', `/dev/classes/${classId}/sets/${setId}/submit`, {
    ...(score === undefined ? {} : { score }),
    ...(maxScore === undefined ? {} : { maxScore }),
  });

/* ---------- server clock and mail (dev) ---------- */

export const advanceClock = (gv: Api, ms: number) => ok(gv, 'POST', '/dev/clock', { advanceMs: ms });
export const resetClock = async (gv: Api) => {
  await call(gv, 'DELETE', '/dev/clock');
};
/** Moves the server clock so it reads `hh:mm` VN on `day`. */
export async function clockTo(gv: Api, day: string, hhmm: string) {
  await resetClock(gv);
  const target = Date.parse(`${day}T${hhmm}:00+07:00`);
  await advanceClock(gv, target - Date.now());
}
export const outbox = async (gv: Api, to: string, tag = 'deadline_reminder'): Promise<any[]> =>
  (await ok(gv, 'GET', `/dev/outbox?to=${encodeURIComponent(to)}&tag=${tag}`)).emails ?? [];

/* ---------- calendar (UI kit Calendar: "Tháng m năm y", days "d tháng m năm y") ---------- */

/** Navigates the calendar inside `scope` to the month of `day` and clicks that day. */
export async function pickDay(scope: Locator, day: string): Promise<void> {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  for (let i = 0; i < 30; i++) {
    const caption = (await scope.getByText(/^Tháng \d+ năm \d+$/).textContent()) ?? '';
    const [, cm, cy] = /Tháng (\d+) năm (\d+)/.exec(caption)!.map(Number) as [number, number, number];
    const diff = (y - cy) * 12 + (m - cm);
    if (diff === 0) break;
    await scope.getByRole('button', { name: diff > 0 ? 'Tháng sau' : 'Tháng trước' }).click();
  }
  await scope.getByRole('button', { name: `${d} tháng ${m} năm ${y}`, exact: true }).click();
}

/* ---------- evidence ---------- */

export async function shot(page: Page, tc: string, n: number | string): Promise<void> {
  const dir = process.env.SAT_MODULE_RUN_DIR;
  if (!dir) return;
  const folder = join(dir, 'screenshots');
  mkdirSync(folder, { recursive: true });
  await page.screenshot({ path: join(folder, `${tc}-${n}.png`), fullPage: true });
}

export const seeText = (page: Page, text: string | RegExp) =>
  expect(page.getByText(text, typeof text === 'string' ? { exact: true } : {}).first()).toBeVisible();
