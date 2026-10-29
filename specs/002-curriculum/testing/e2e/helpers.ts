// Shared preconditions for the 002 QA scripts (TC-###.spec.ts): API calls a test case's "Tiền điều kiện" allows,
// evidence screenshots and second sign-ins. Not a test file itself.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, type Page, expect } from '@playwright/test';
import { loginAs } from '../../../../tests/e2e/fixtures';

export const ORIGIN = `http://127.0.0.1:${process.env.PORT ?? '4173'}`;
export const uid = (): string => Math.random().toString(36).slice(2, 7);

/** Ready content (test-cases.md "Nội dung sẵn sàng"). */
export const READY_STEP = { blocks: [{ type: 'text', text: '你好 nǐ hǎo — Xin chào' }] };
export const READY_SET = {
  questions: [
    { type: 'mcq', prompt: '你好 nghĩa là gì?', options: ['Xin chào', 'Tạm biệt'], answer: 0 },
  ],
};

export interface ApiResult {
  status: number;
  body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Calls the API with `page`'s session cookie (as the browser would, with the Origin header). */
export async function call(page: Page, method: string, path: string, data?: unknown): Promise<ApiResult> {
  const res = await page.request.fetch(`/api${path}`, {
    method,
    ...(data === undefined ? {} : { data }),
    headers: { Origin: ORIGIN },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status(), body };
}

/** Like `call` but the request must succeed (a precondition, not the thing under test). */
export async function ok(page: Page, method: string, path: string, data?: unknown) {
  const r = await call(page, method, path, data);
  if (r.status >= 300) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

export const createCurriculum = (page: Page, name: string, hsk = 1, description?: string) =>
  ok(page, 'POST', '/curricula', { name, hsk, ...(description ? { description } : {}) });

export const addLesson = (page: Page, curriculumId: string, name: string) =>
  ok(page, 'POST', `/curricula/${curriculumId}/lessons`, { name });

export const getLesson = (page: Page, lessonId: string) => ok(page, 'GET', `/lessons/${lessonId}`);

type Section = 'lesson' | 'exercise';
/**
 * Adds an item; with `title`/`content` it is saved, with `publish` it is saved and published, with `archive` it is
 * then archived (published → archived). Returns the new item id.
 */
export async function addItem(
  page: Page,
  lessonId: string,
  section: Section,
  opts: { title?: string; content?: unknown; publish?: boolean; archive?: boolean } = {},
): Promise<string> {
  const { itemId, lesson } = await ok(page, 'POST', `/lessons/${lessonId}/items`, { section });
  let item = lesson.items.find((i: { id: string }) => i.id === itemId);
  if (opts.title !== undefined || opts.content !== undefined || opts.publish) {
    const body = {
      expectedVersion: item.version,
      title: opts.title ?? '',
      content: opts.content ?? (section === 'lesson' ? READY_STEP : READY_SET),
    };
    const saved = await ok(
      page,
      opts.publish || opts.archive ? 'POST' : 'PUT',
      `/lessons/${lessonId}/items/${itemId}${opts.publish || opts.archive ? '/publish' : ''}`,
      body,
    );
    item = saved.items.find((i: { id: string }) => i.id === itemId);
  }
  if (opts.archive) {
    await ok(page, 'POST', `/lessons/${lessonId}/items/${itemId}/archive`, {
      expectedVersion: item.version,
    });
  }
  return itemId;
}

export async function publishLesson(page: Page, lessonId: string, itemIds: string[]) {
  const l = await getLesson(page, lessonId);
  return ok(page, 'POST', `/lessons/${lessonId}/publish`, { expectedVersion: l.version, itemIds });
}

/** 003 stand-in: a class using the curriculum. */
export const devClass = (
  page: Page,
  curriculumId: string,
  name: string,
  opts: { status?: 'upcoming' | 'active' | 'ended'; startDate?: string; studentEmails?: string[] } = {},
) =>
  ok(page, 'POST', '/dev/curriculum/classes', {
    curriculumId,
    name,
    status: opts.status ?? 'active',
    startDate: opts.startDate ?? '2026-10-01',
    studentEmails: opts.studentEmails ?? [],
  });

/** 005 stand-in: the set has attempts / submissions. */
export const learningData = (page: Page, itemId: string) =>
  ok(page, 'POST', '/dev/curriculum/learning-data', { itemId });

/** 010 stand-in: AI label of a Bài. */
export const aiLabel = (
  page: Page,
  lessonId: string,
  state: 'generating' | 'review' | null,
  percent?: number,
) => ok(page, 'POST', '/dev/curriculum/ai-label', { lessonId, state, ...(percent === undefined ? {} : { percent }) });

/** Signs a brand-new GV (empty workspace) into `page`'s context, as at A02. */
export async function registerGv(page: Page, name = 'Cô Bình'): Promise<string> {
  await page.request.delete('/api/dev/throttles', { headers: { Origin: ORIGIN } });
  const email = `gvb+${Date.now()}${uid()}@sat.dev`;
  const r = await call(page, 'POST', '/auth/register', {
    displayName: name,
    email,
    password: 'Binh2026x',
    passwordConfirm: 'Binh2026x',
  });
  if (r.status !== 201) throw new Error(`register → ${r.status} ${JSON.stringify(r.body)}`);
  return email;
}

/** A second browser (other user) signed in as `role` of the seed workspace. */
export async function otherPage(browser: Browser, role: 'GV' | 'HV'): Promise<Page> {
  const ctx = await browser.newContext({ baseURL: ORIGIN, viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto('/');
  await loginAs(p, role);
  return p;
}

/** Evidence: runs/<ts>/screenshots/TC-###-<n>.png (the run folder is set by the runner). */
export async function shot(page: Page, tc: string, n: number | string): Promise<void> {
  const dir = process.env.SAT_MODULE_RUN_DIR;
  if (!dir) return;
  const folder = join(dir, 'screenshots');
  mkdirSync(folder, { recursive: true });
  await page.screenshot({ path: join(folder, `${tc}-${n}.png`), fullPage: true });
}

/** Opens the GV area signed in as the seed GV (Cô Lan). */
export async function asGv(page: Page): Promise<void> {
  await page.goto('/');
  await loginAs(page, 'GV');
}

/** A toast / inline message with exactly this text appears. */
export const seeText = (page: Page, text: string) =>
  expect(page.getByText(text, { exact: true }).first()).toBeVisible();

/** The row (listitem) of a Bài on T06. */
export const lessonRow = (page: Page, name: string) => page.getByRole('listitem', { name, exact: true });
