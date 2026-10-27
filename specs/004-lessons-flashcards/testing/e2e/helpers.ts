/* eslint-disable @typescript-eslint/no-explicit-any -- QA scripts read untyped API JSON */
// Shared steps of the 004 QA scripts: data set-up through the API (as the test cases' preconditions say), generated
// files (PNG, PDF, DOCX, PPTX, XLSX, WAV, WebM) and evidence screenshots. Not a test file.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, type Page, expect } from '@playwright/test';
import { strToU8, zipSync } from 'fflate';
import { loginAs } from '../../../../tests/e2e/fixtures';

export const ORIGIN = 'http://127.0.0.1:4173';
export const GV_VIEW = { viewport: { width: 1280, height: 800 } };
export const HV_VIEW = { viewport: { width: 390, height: 844 } };
const GB = 1024 ** 3;
export const MB = 1024 ** 2;

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/** Today in Vietnam, YYYY-MM-DD. */
export const vnToday = (offsetDays = 0) =>
  new Date(Date.now() + 7 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);

/** Evidence screenshot into the run folder (when replayed / run by QA). */
export async function evidence(page: Page, tc: string, n = 1): Promise<void> {
  const dir = process.env.SAT_MODULE_RUN_DIR;
  if (!dir) return;
  mkdirSync(join(dir, 'screenshots'), { recursive: true });
  await page.screenshot({ path: join(dir, 'screenshots', `${tc}-${n}.png`), fullPage: true });
}

export async function api<T = any>(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown,
  expectStatus?: number,
): Promise<T> {
  const res = await page.request.fetch(path, {
    method,
    headers: { Origin: ORIGIN },
    ...(data === undefined ? {} : { data: data as any }),
  });
  const text = await res.text();
  if (expectStatus !== undefined) expect(res.status(), `${method} ${path}: ${text}`).toBe(expectStatus);
  else expect(res.ok(), `${method} ${path}: ${res.status()} ${text}`).toBeTruthy();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/** A GV page (1280 × 800) and its session. */
export async function gvPage(browser: Browser) {
  const ctx = await browser.newContext({ ...GV_VIEW, baseURL: ORIGIN });
  const page = await ctx.newPage();
  const who = await loginAs(page, 'GV');
  return { ctx, page, who };
}

/** An HV page (390 × 844) signed in as the given seeded student (default: the first one). */
export async function hvPage(browser: Browser, userId?: string) {
  const ctx = await browser.newContext({ ...HV_VIEW, baseURL: ORIGIN });
  const page = await ctx.newPage();
  const res = await page.request.post('/api/dev/session', {
    data: { role: 'HV', ...(userId ? { userId } : {}) },
    headers: { Origin: ORIGIN },
  });
  expect(res.status()).toBe(201);
  const who = await res.json();
  return { ctx, page, who };
}

/** Ids of the seeded, activated students of the GV's workspace. */
export async function studentIds(gv: Page): Promise<string[]> {
  const res = await api<{ items: { id: string }[] }>(gv, 'GET', '/api/students');
  return res.items.map((s) => s.id);
}

export async function newCurriculum(gv: Page, name = `QA ${uid()}`) {
  return api<{ id: string }>(gv, 'POST', '/api/curricula', { name, hsk: 1 });
}
export async function newLesson(gv: Page, curriculumId: string, name = 'Bài 1') {
  return api<{ id: string; version: number }>(gv, 'POST', `/api/curricula/${curriculumId}/lessons`, { name });
}
export async function getLesson(gv: Page, lessonId: string) {
  return api<any>(gv, 'GET', `/api/lessons/${lessonId}`);
}
export async function addStep(gv: Page, lessonId: string, afterItemId?: string): Promise<string> {
  const res = await api<{ itemId: string }>(gv, 'POST', `/api/lessons/${lessonId}/items`, {
    section: 'lesson',
    ...(afterItemId ? { afterItemId } : {}),
  });
  return res.itemId;
}
export async function addSet(gv: Page, lessonId: string): Promise<string> {
  const res = await api<{ itemId: string }>(gv, 'POST', `/api/lessons/${lessonId}/items`, {
    section: 'exercise',
  });
  return res.itemId;
}
async function version(gv: Page, lessonId: string, itemId: string): Promise<number> {
  const l = await getLesson(gv, lessonId);
  return l.items.find((i: any) => i.id === itemId).version;
}
export async function saveStep(gv: Page, lessonId: string, itemId: string, title: string, content: unknown) {
  return api(gv, 'PUT', `/api/lessons/${lessonId}/items/${itemId}`, {
    expectedVersion: await version(gv, lessonId, itemId),
    title,
    content,
  });
}
export async function publishStep(gv: Page, lessonId: string, itemId: string, title: string, content: unknown) {
  return api(gv, 'POST', `/api/lessons/${lessonId}/items/${itemId}/publish`, {
    expectedVersion: await version(gv, lessonId, itemId),
    title,
    content,
  });
}
export async function publishSet(gv: Page, lessonId: string, itemId: string, title: string) {
  return api(gv, 'POST', `/api/lessons/${lessonId}/items/${itemId}/publish`, {
    expectedVersion: await version(gv, lessonId, itemId),
    title,
    content: {
      questions: [{ type: 'mcq', prompt: '你好?', options: ['Xin chào', 'Tạm biệt'], answer: 0 }],
    },
  });
}
export async function archiveStep(gv: Page, lessonId: string, itemId: string) {
  return api(gv, 'POST', `/api/lessons/${lessonId}/items/${itemId}/archive`, {
    expectedVersion: await version(gv, lessonId, itemId),
  });
}
export async function publishLesson(gv: Page, lessonId: string) {
  const l = await getLesson(gv, lessonId);
  return api(gv, 'POST', `/api/lessons/${lessonId}/publish`, { expectedVersion: l.version, itemIds: [] });
}
/** A published step with the given blocks (one call: add + publish). */
export async function publishedStep(gv: Page, lessonId: string, title: string, blocks: unknown[], goal = '') {
  const id = await addStep(gv, lessonId);
  await publishStep(gv, lessonId, id, title, { goal, blocks });
  return id;
}

export async function upload(gv: Page, kind: string, name: string, bytes: Uint8Array | Buffer) {
  const res = await gv.request.post(`/api/steps/files?kind=${kind}`, {
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(name),
    },
    data: Buffer.from(bytes),
  });
  return { status: res.status(), body: await res.json() };
}

export async function newClass(gv: Page, curriculumId: string, students: string[], startDate = vnToday()) {
  return api<{ id: string }>(gv, 'POST', '/api/classes', {
    name: `Lớp QA ${uid()}`,
    startDate,
    curriculumId,
    studentIds: students,
    createKey: `qa-${uid()}`,
  });
}
export async function setStorage(gv: Page, usedBytes: number) {
  return api(gv, 'POST', '/api/dev/steps/storage', { usedBytes: Math.round(usedBytes) }, 204);
}
export const gb = (x: number) => x * GB;

/** Paths of the screens under test. */
export const T07 = (cur: string, les: string) => `/gv/giao-trinh/${cur}/bai/${les}/bai-hoc`;
export const T21 = (cur: string, les: string) => `/gv/giao-trinh/${cur}/bai/${les}/xem-truoc`;
export const S03 = (cls: string, step: string) => `/hv/lop/${cls}/buoc/${step}`;
export const S04 = (cls: string, step: string, deck: string) => `/hv/lop/${cls}/buoc/${step}/the-tu?khoi=${deck}`;
export const S11 = (cls: string, les: string) => `/hv/lop/${cls}/bai/${les}`;

/* ---------- content builders ---------- */

export const text = (html: string, id = 't') => ({ id, type: 'text', html });
export const vocab = (words: Partial<Record<'hanzi' | 'pinyin' | 'pos' | 'meaning' | 'example', string>>[], id = 'v') => ({
  id,
  type: 'vocab',
  words,
});
export const deck = (cards: { id: string; front: string; pinyin?: string; meaning: string; [k: string]: unknown }[], name = 'Từ mới', id = 'k') => ({
  id,
  type: 'deck',
  name,
  cards,
});
export const fileBlock = (type: string, file: unknown, caption = '', id = `${type}1`) => ({ id, type, file, caption });

/* ---------- generated files ---------- */

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

export function pdf(pages: string[]): Buffer {
  const objs: string[] = ['<< /Type /Catalog /Pages 2 0 R >>'];
  objs.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach((t, i) => {
    const c = `BT /F1 24 Tf 72 700 Td (${t}) Tj ET`;
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${4 + i * 2} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>`,
    );
    objs.push(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
  });
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** A DOCX whose pages are separated by explicit page breaks. */
export function docx(pages: string[]): Buffer {
  const body = pages
    .map((t, i) => `<w:p><w:r>${i ? '<w:br w:type="page"/>' : ''}<w:t>${esc(t)}</w:t></w:r></w:p>`)
    .join('');
  return Buffer.from(
    zipSync({
      '[Content_Types].xml': strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
      'word/document.xml': strToU8(
        `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
      ),
    }),
  );
}

export function pptx(slides: string[]): Buffer {
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
  };
  slides.forEach((t, i) => {
    files[`ppt/slides/slide${i + 1}.xml`] = strToU8(
      `<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="x"><a:p><a:r><a:t>${esc(t)}</a:t></a:r></a:p></p:sld>`,
    );
  });
  return Buffer.from(zipSync(files));
}

/** An .xlsx whose first sheet has `rows` (first row = header), inline strings. */
export function xlsx(rows: string[][], sheet = 'Từ vựng'): Buffer {
  const col = (i: number) => String.fromCharCode(65 + i);
  const data = rows
    .map(
      (r, ri) =>
        `<row r="${ri + 1}">${r
          .map((c, ci) => (c === '' ? '' : `<c r="${col(ci)}${ri + 1}" t="inlineStr"><is><t>${esc(c)}</t></is></c>`))
          .join('')}</row>`,
    )
    .join('');
  return Buffer.from(
    zipSync({
      '[Content_Types].xml': strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'),
      'xl/workbook.xml': strToU8(
        `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheet}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
      'xl/_rels/workbook.xml.rels': strToU8(
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      ),
      'xl/worksheets/sheet1.xml': strToU8(
        `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${data}</sheetData></worksheet>`,
      ),
    }),
  );
}

/** A real 1 s mono WAV (440 Hz). */
export function wav(seconds = 1): Buffer {
  const rate = 8000;
  const n = rate * seconds;
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), 44 + i * 2);
  return b;
}

/** A real, playable WebM recorded in the browser (canvas + MediaRecorder). */
export async function webm(page: Page, ms = 1200): Promise<Buffer> {
  const b64 = await page.evaluate(async (duration) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    const stream = canvas.captureStream(15);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.start(100);
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const draw = () => {
        const t = performance.now() - start;
        ctx.fillStyle = `hsl(${t / 5}, 70%, 50%)`;
        ctx.fillRect(0, 0, 160, 90);
        if (t < duration) requestAnimationFrame(draw);
        else resolve();
      };
      draw();
    });
    rec.stop();
    await done;
    const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer();
    let s = '';
    for (const byte of new Uint8Array(buf)) s += String.fromCharCode(byte);
    return btoa(s);
  }, ms);
  return Buffer.from(b64, 'base64');
}

/** Selects a file on a hidden <input type=file> reached through the button that opens it. */
export async function chooseFile(page: Page, button: ReturnType<Page['getByRole']>, file: { name: string; mimeType: string; buffer: Buffer }) {
  const chooser = page.waitForEvent('filechooser');
  await button.click();
  await (await chooser).setFiles(file);
}

/** Slow network for uploads (Chromium network emulation): `bytesPerSecond` up. */
export async function slowUploads(page: Page, bytesPerSecond: number): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: bytesPerSecond,
  });
}

/** Holds every upload's answer for `ms` after its bytes arrived (the "Đang xử lý…" window). */
export async function delayUploadAnswers(page: Page, ms: number): Promise<void> {
  await page.route('**/api/steps/files?**', async (route) => {
    const response = await route.fetch();
    await new Promise((r) => setTimeout(r, ms));
    await route.fulfill({ response });
  });
}

/** A file of `size` bytes with the magic bytes of `ext` (for size / progress cases). */
export function padded(ext: 'webm' | 'wav' | 'pdf' | 'png', size: number): Buffer {
  const head =
    ext === 'webm'
      ? Buffer.from([0x1a, 0x45, 0xdf, 0xa3])
      : ext === 'wav'
        ? wav(1)
        : ext === 'pdf'
          ? pdf(['Trang'])
          : png();
  const b = Buffer.alloc(Math.max(size, head.length));
  head.copy(b);
  return b;
}

/** A GV of a brand-new workspace (registered through the A02 API) — for storage cases that must not share a workspace. */
export async function freshGvPage(browser: Browser) {
  const ctx = await browser.newContext({ ...GV_VIEW, baseURL: ORIGIN });
  const page = await ctx.newPage();
  await page.request.delete('/api/dev/throttles', { headers: { Origin: ORIGIN } });
  const email = `gvqa+${uid()}@sat.dev`;
  const res = await page.request.post('/api/auth/register', {
    headers: { Origin: ORIGIN },
    data: { displayName: 'GV QA', email, password: 'QaPass2026x', passwordConfirm: 'QaPass2026x' },
  });
  expect(res.status(), await res.text()).toBe(201);
  return { ctx, page, who: await res.json(), email };
}

export async function hideSection(gv: Page, classId: string, lessonId: string, section: 'lesson' | 'exercise', hidden = true) {
  return api(gv, 'PUT', `/api/classes/${classId}/visibility`, { hidden, scope: { kind: 'section', lessonId, section } });
}
export async function setDeadline(gv: Page, classId: string, setId: string, date: string | null) {
  return api(gv, 'PUT', `/api/classes/${classId}/deadlines`, { target: { setId }, date });
}
export async function endClass(gv: Page, classId: string) {
  return api(gv, 'POST', `/api/classes/${classId}/end`);
}
export async function linkPractice(gv: Page, setId: string, stepId: string | null) {
  return api(gv, 'POST', '/api/dev/steps/practice', { setId, stepId }, 204);
}
/** The HV's mark through the S04 API. */
export async function markCard(hv: Page, classId: string, stepId: string, deckId: string, cardId: string, mark: 'known' | 'unknown') {
  return api(hv, 'PUT', '/api/learn/marks', { classId, stepId, deckId, cardId, mark }, 204);
}
/** 010's approval of the Bài học section (dev stand-in): preview, then replace with its token. */
export async function aiApprove(gv: Page, lessonId: string, items: { title: string; content: unknown }[]) {
  const body = { lessonId, section: 'lesson', items };
  const preview = await api(gv, 'POST', '/api/dev/curriculum/ai-approve/preview', body);
  return api(gv, 'POST', '/api/dev/curriculum/ai-approve', { ...body, token: preview.token });
}
