import { z } from 'zod';
import { numberedToToneMarks } from './pinyin.js';

/* Module 004 contracts: the content of a step (blocks, cards), its field and publish rules, files, storage and wording. */

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const STEP_LIMITS = {
  titleMax: 100,
  goalMax: 300,
  blocksPerStep: 50,
  textMax: 20_000,
  captionMax: 200,
  wordsPerBlock: 100,
  hanziMax: 50,
  pinyinMax: 100,
  meaningMax: 200,
  exampleMax: 300,
  grammarNameMax: 150,
  structureMax: 200,
  explanationMax: 5000,
  examplesPerPoint: 20,
  sentenceMax: 200,
  examplePinyinMax: 300,
  exampleMeaningMax: 300,
  dialogueTitleMax: 150,
  linesPerBlock: 100,
  speakerMax: 30,
  lineHanziMax: 300,
  linePinyinMax: 600,
  translationMax: 600,
  deckNameMax: 150,
  cardsPerDeck: 200,
  excelMaxBytes: 5 * MB,
} as const;

export const STORAGE_QUOTA_BYTES = 10 * GB;
const STORAGE_WARN_PERCENT = 80;

/* ---------- block types ---------- */

export const BLOCK_TYPES = [
  'text',
  'vocab',
  'grammar',
  'dialogue',
  'deck',
  'document',
  'video',
  'image',
  'audio',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: 'Văn bản',
  vocab: 'Từ vựng',
  grammar: 'Ngữ pháp / mẫu câu',
  dialogue: 'Hội thoại / Bài khóa',
  deck: 'Bộ thẻ từ vựng',
  document: 'Tài liệu',
  video: 'Video',
  image: 'Hình ảnh',
  audio: 'Âm thanh',
};

/** "Loại từ" of a vocabulary entry (AC-4.1). */
export const WORD_CLASSES = [
  'Danh từ',
  'Động từ',
  'Tính từ',
  'Phó từ',
  'Đại từ',
  'Số từ',
  'Lượng từ',
  'Giới từ',
  'Liên từ',
  'Trợ từ',
  'Thán từ',
  'Động từ năng nguyện',
  'Cụm từ',
] as const;

/** The 8 fixed text colours of the text block (AC-3.5). */
export const TEXT_COLORS = [
  { name: 'Mặc định', value: '#1f2937' },
  { name: 'Đỏ', value: '#dc2626' },
  { name: 'Cam', value: '#ea580c' },
  { name: 'Vàng', value: '#ca8a04' },
  { name: 'Xanh lá', value: '#16a34a' },
  { name: 'Xanh dương', value: '#2563eb' },
  { name: 'Tím', value: '#7c3aed' },
  { name: 'Xám', value: '#6b7280' },
] as const;

/* ---------- files (REQ-5, REQ-11) ---------- */

export const FILE_KINDS = [
  'video',
  'document',
  'image',
  'audio',
  'cardImage',
  'cardAudio',
] as const;
export const fileKindSchema = z.enum(FILE_KINDS);
export type FileKind = z.infer<typeof fileKindSchema>;

interface FileRule {
  /** Block label used in messages. */
  label: string;
  /** Formats as listed to the GV. */
  formats: string;
  types: Record<string, string>;
  maxBytes: number;
}

const IMAGE_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};
const AUDIO_TYPES = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav' };

export const FILE_RULES: Record<FileKind, FileRule> = {
  video: {
    label: 'Video',
    formats: 'MP4, MOV, WebM',
    types: { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' },
    maxBytes: 500 * MB,
  },
  document: {
    label: 'Tài liệu',
    formats: 'PDF, DOCX, PPTX',
    types: {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
    maxBytes: 50 * MB,
  },
  image: {
    label: 'Hình ảnh',
    formats: 'JPG/JPEG, PNG, WebP, GIF',
    types: IMAGE_TYPES,
    maxBytes: 10 * MB,
  },
  audio: { label: 'Âm thanh', formats: 'MP3, M4A, WAV', types: AUDIO_TYPES, maxBytes: 50 * MB },
  cardImage: {
    label: 'Hình ảnh',
    formats: 'JPG/JPEG, PNG, WebP, GIF',
    types: IMAGE_TYPES,
    maxBytes: 5 * MB,
  },
  cardAudio: { label: 'Âm thanh', formats: 'MP3, M4A, WAV', types: AUDIO_TYPES, maxBytes: 5 * MB },
};

/** Lower-case extension without the dot ('' when none). */
export const fileExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
};

/** Content type of an accepted file of `kind`, or null when the extension is not accepted. */
export const contentTypeFor = (kind: FileKind, name: string): string | null =>
  FILE_RULES[kind].types[fileExtension(name)] ?? null;

/** Bytes for people: "300 KB", "612,4 MB", "1,5 GB" (1 GB = 1024 MB). */
export function formatSize(bytes: number): string {
  const fmt = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');
  if (bytes >= GB) return `${fmt(bytes / GB)} GB`;
  if (bytes >= MB) return `${fmt(bytes / MB)} MB`;
  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

export const unsupportedFormatMessage = (kind: FileKind): string =>
  `Định dạng không được hỗ trợ. Khối ${FILE_RULES[kind].label} chỉ nhận: ${FILE_RULES[kind].formats}.`;
export const tooLargeMessage = (kind: FileKind, name: string, size: number): string =>
  `Tệp ${name} (${formatSize(size)}) vượt quá giới hạn ${formatSize(FILE_RULES[kind].maxBytes)} của khối ${FILE_RULES[kind].label}.`;
export const corruptFileMessage = (kind: FileKind): string =>
  `Tệp bị hỏng hoặc không đúng định dạng ${FILE_RULES[kind].label}.`;

/** AC-5.2, AC-5.3: why a chosen file is refused before any upload, or null. */
export function checkFileChoice(kind: FileKind, name: string, size: number): string | null {
  if (!contentTypeFor(kind, name)) return unsupportedFormatMessage(kind);
  if (size > FILE_RULES[kind].maxBytes) return tooLargeMessage(kind, name, size);
  return null;
}

/* ---------- storage (AC-5.5 – AC-5.7) ---------- */

export const storageUsedLabel = (used: number): string =>
  `Đã dùng ${String(Math.floor((used * 10) / GB) / 10).replace('.', ',')} GB / 10 GB`;
export const storagePercent = (used: number): number =>
  Math.floor((used * 100) / STORAGE_QUOTA_BYTES);
export const storageWarning = (used: number): string | null =>
  storagePercent(used) >= STORAGE_WARN_PERCENT
    ? `Workspace đã dùng ${storagePercent(used)}% dung lượng lưu trữ.`
    : null;
export const storageFullMessage = (remaining: number): string =>
  `Không đủ dung lượng lưu trữ (còn ${remaining > 0 ? formatSize(remaining) : '0 MB'}). Hãy xóa bớt tệp không dùng trong các bài học.`;

/* ---------- Hanzi, pinyin, YouTube ---------- */

export const hasHanzi = (s: string): boolean => /\p{Script=Han}/u.test(s);

/** AC-4.5: tone numbers to tone marks; marked syllables are kept. */
export const convertPinyin = (s: string): string => numberedToToneMarks(s);

/** The first syllable that still carries a digit after conversion (AC-4.4), or null. */
export const badPinyin = (s: string): string | null =>
  s.split(/[\s,.;:!?，。！？、；：]+/).find((t) => /\d/.test(t)) ?? null;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** AC-18.2: the video id of a youtube.com/watch, youtu.be or youtube.com/shorts link, or null. */
export function parseYouTubeUrl(raw: string): string | null {
  // No URL global here (shared runs without DOM / Node libs): scheme, host, path and query by hand.
  const m = /^(?:https?:\/\/)?([^/?#\s]+)(\/[^?#\s]*)?(\?[^#\s]*)?(#\S*)?$/i.exec(raw.trim());
  if (!m) return null;
  const host = (m[1] ?? '').toLowerCase().replace(/^(www|m)\./, '');
  const path = m[2] ?? '/';
  const query = m[3] ?? '';
  let id: string | null = null;
  if (host === 'youtu.be') id = path.split('/')[1] ?? null;
  else if (host === 'youtube.com') {
    if (path === '/watch') id = /[?&]v=([^&]*)/.exec(query)?.[1] ?? null;
    else if (path.startsWith('/shorts/')) id = path.split('/')[2] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/* ---------- rich text (AC-3.5, AC-3.7, NFR-6) ---------- */

const RENAME: Record<string, string> = {
  p: 'p',
  div: 'p',
  br: 'br',
  b: 'b',
  strong: 'b',
  i: 'i',
  em: 'i',
  u: 'u',
  h1: 'h3',
  h2: 'h4',
  h3: 'h3',
  h4: 'h4',
  h5: 'h4',
  h6: 'h4',
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  a: 'a',
  span: 'span',
  font: 'span',
};
/** Dropped together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'head',
  'title',
  'svg',
  'math',
  'textarea',
  'select',
]);
const PALETTE = new Set<string>(TEXT_COLORS.map((c) => c.value));

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};
function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    const k = e.toLowerCase();
    if (k.startsWith('#')) {
      const code = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    return NAMED[k] ?? m;
  });
}
const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, '&quot;');

function attributes(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of raw.matchAll(
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g,
  )) {
    out[(m[1] ?? '').toLowerCase()] = decodeEntities(m[3] ?? m[4] ?? m[5] ?? '');
  }
  return out;
}

function paletteColor(value: string | undefined): string | null {
  if (!value) return null;
  let v = value.trim().toLowerCase();
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(v);
  if (rgb)
    v = `#${rgb
      .slice(1, 4)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')}`;
  else if (/^#[0-9a-f]{3}$/.test(v)) v = `#${[...v.slice(1)].map((c) => c + c).join('')}`;
  return PALETTE.has(v) ? v : null;
}

/** The colour of a span / font, when it is the only style and one of the palette's. */
function colorOf(tag: string, attrs: Record<string, string>): string | null {
  if (tag === 'font') return paletteColor(attrs['color']);
  const style = (attrs['style'] ?? '').trim().replace(/;\s*$/, '');
  const m = /^color\s*:\s*([^;]+)$/i.exec(style);
  return m ? paletteColor(m[1]) : null;
}

/**
 * Whitelist HTML of the text block and the grammar explanation: b, i, u, h3/h4, ul/ol/li, p, br, http(s) links and
 * palette colours. Everything else is removed (its text kept, except scripts, styles and embeds). Used on save (API) and
 * again before rendering (web).
 */
export function sanitizeRichText(html: string): string {
  let out = '';
  const stack: { tag: string; emit: boolean }[] = [];
  let skip: string | null = null;
  const token =
    /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>|<[^>]*>?/g;
  let last = 0;
  for (const m of html.matchAll(token)) {
    const text = html.slice(last, m.index);
    last = (m.index ?? 0) + m[0].length;
    if (!skip && text) out += escapeText(decodeEntities(text));
    const name = (m[1] ?? '').toLowerCase();
    if (!name) continue;
    const closing = m[0].startsWith('</');
    if (skip) {
      if (closing && name === skip) skip = null;
      continue;
    }
    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing && !m[0].endsWith('/>')) skip = name;
      continue;
    }
    const tag = RENAME[name];
    if (!tag) continue;
    if (tag === 'br') {
      if (!closing) out += '<br>';
      continue;
    }
    if (closing) {
      const at = stack.map((s) => s.tag).lastIndexOf(tag);
      if (at < 0) continue;
      while (stack.length > at) {
        const top = stack.pop();
        if (top?.emit) out += `</${top.tag}>`;
      }
      continue;
    }
    const attrs = attributes(m[2] ?? '');
    let open = `<${tag}>`;
    let emit = true;
    if (tag === 'a') {
      const href = attrs['href'] ?? '';
      emit = /^https?:\/\/[^\s"'<>]+$/i.test(href);
      open = `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
    } else if (tag === 'span') {
      const color = colorOf(name, attrs);
      emit = !!color;
      open = `<span style="color:${color}">`;
    }
    if (emit) out += open;
    stack.push({ tag, emit });
  }
  if (!skip) out += escapeText(decodeEntities(html.slice(last)));
  while (stack.length) {
    const top = stack.pop();
    if (top?.emit) out += `</${top.tag}>`;
  }
  return out;
}

/** The plain text of rich text (tags removed, entities decoded). */
export const richTextPlain = (html: string): string =>
  decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''));
export const richTextLength = (html: string): number => [...richTextPlain(html)].length;
export const richTextIsEmpty = (html: string): boolean => richTextPlain(html).trim() === '';
/** Plain text (interim 002 blocks, Excel examples) as paragraphs. */
export const textToHtml = (text: string): string =>
  text
    .split('\n')
    .map((line) => `<p>${escapeText(line)}</p>`)
    .join('');

/* ---------- content schemas ---------- */

const blockId = z.string().min(1).max(40);
const str = (max: number) => z.string().max(max).default('');

export const fileRefSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i),
  name: z.string().max(255),
  size: z.number().int().min(0),
  contentType: z.string().max(120),
  /** Page count of a DOCX / PPTX preview (null for other files). */
  pages: z.number().int().min(0).nullable().default(null),
  /** Signed link, only in responses (stripped before saving). */
  url: z.string().optional(),
});
export type FileRef = z.infer<typeof fileRefSchema>;

export const vocabWordSchema = z.object({
  hanzi: str(STEP_LIMITS.hanziMax),
  pinyin: str(STEP_LIMITS.pinyinMax),
  pos: z.enum(['', ...WORD_CLASSES]).default(''),
  meaning: str(STEP_LIMITS.meaningMax),
  example: str(STEP_LIMITS.exampleMax),
});
export type VocabWord = z.infer<typeof vocabWordSchema>;

export const grammarExampleSchema = z.object({
  sentence: str(STEP_LIMITS.sentenceMax),
  pinyin: str(STEP_LIMITS.examplePinyinMax),
  meaning: str(STEP_LIMITS.exampleMeaningMax),
});
export type GrammarExample = z.infer<typeof grammarExampleSchema>;

export const dialogueLineSchema = z.object({
  speaker: str(STEP_LIMITS.speakerMax),
  hanzi: str(STEP_LIMITS.lineHanziMax),
  pinyin: str(STEP_LIMITS.linePinyinMax),
  translation: str(STEP_LIMITS.translationMax),
});
export type DialogueLine = z.infer<typeof dialogueLineSchema>;

export const cardSchema = z.object({
  id: blockId,
  front: str(STEP_LIMITS.hanziMax),
  pinyin: str(STEP_LIMITS.pinyinMax),
  meaning: str(STEP_LIMITS.meaningMax),
  example: str(STEP_LIMITS.exampleMax),
  image: fileRefSchema.nullable().default(null),
  audio: fileRefSchema.nullable().default(null),
});
export type Card = z.infer<typeof cardSchema>;

const textBlock = z.object({ id: blockId, type: z.literal('text'), html: z.string().max(200_000) });
const vocabBlock = z.object({
  id: blockId,
  type: z.literal('vocab'),
  words: z.array(vocabWordSchema).max(STEP_LIMITS.wordsPerBlock).default([]),
});
const grammarBlock = z.object({
  id: blockId,
  type: z.literal('grammar'),
  name: str(STEP_LIMITS.grammarNameMax),
  structure: str(STEP_LIMITS.structureMax),
  explanation: z.string().max(100_000).default(''),
  examples: z.array(grammarExampleSchema).max(STEP_LIMITS.examplesPerPoint).default([]),
});
const dialogueBlock = z.object({
  id: blockId,
  type: z.literal('dialogue'),
  kind: z.enum(['dialogue', 'passage']).default('dialogue'),
  title: str(STEP_LIMITS.dialogueTitleMax),
  lines: z.array(dialogueLineSchema).max(STEP_LIMITS.linesPerBlock).default([]),
});
const deckBlock = z.object({
  id: blockId,
  type: z.literal('deck'),
  name: str(STEP_LIMITS.deckNameMax),
  cards: z.array(cardSchema).max(STEP_LIMITS.cardsPerDeck).default([]),
});
const fileFields = {
  id: blockId,
  file: fileRefSchema.nullable().default(null),
  caption: str(STEP_LIMITS.captionMax),
};
const videoBlock = z.object({
  ...fileFields,
  type: z.literal('video'),
  youtube: z.string().regex(YOUTUBE_ID).nullable().default(null),
});
const documentBlock = z.object({ ...fileFields, type: z.literal('document') });
const imageBlock = z.object({ ...fileFields, type: z.literal('image') });
const audioBlock = z.object({ ...fileFields, type: z.literal('audio') });

export const blockSchema = z.discriminatedUnion('type', [
  textBlock,
  vocabBlock,
  grammarBlock,
  dialogueBlock,
  deckBlock,
  documentBlock,
  videoBlock,
  imageBlock,
  audioBlock,
]);
export type Block = z.infer<typeof blockSchema>;
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;
export type FileBlock = BlockOf<'document' | 'video' | 'image' | 'audio'>;
export const isFileBlock = (b: Block): b is FileBlock =>
  b.type === 'document' || b.type === 'video' || b.type === 'image' || b.type === 'audio';

/** Interim 002 content (`{ type: 'text', text }`, no ids) is upgraded on read. */
function upgrade(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const c = raw as { goal?: unknown; blocks?: unknown };
  if (!Array.isArray(c.blocks)) return raw;
  return {
    ...c,
    blocks: c.blocks.map((b: unknown, i: number) => {
      if (!b || typeof b !== 'object') return b;
      const block = b as Record<string, unknown>;
      const id = typeof block['id'] === 'string' ? block['id'] : `b${i}`;
      if (
        block['type'] === 'text' &&
        typeof block['text'] === 'string' &&
        block['html'] === undefined
      ) {
        return { id, type: 'text', html: textToHtml(block['text']) };
      }
      return { ...block, id };
    }),
  };
}

export const stepContentSchema = z.preprocess(
  upgrade,
  z.object({
    goal: z.string().max(STEP_LIMITS.goalMax).default(''),
    blocks: z.array(blockSchema).max(STEP_LIMITS.blocksPerStep),
  }),
);
export type StepContent = z.infer<typeof stepContentSchema>;

/** A random block / card id (unique within a step). */
export const newBlockId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** An empty block of `type` (AC-3.1, AC-11.9: a new deck is "Bộ thẻ mới" with one empty card). */
export function newBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case 'text':
      return { id, type, html: '' };
    case 'vocab':
      return { id, type, words: [emptyWord()] };
    case 'grammar':
      return { id, type, name: '', structure: '', explanation: '', examples: [emptyExample()] };
    case 'dialogue':
      return { id, type, kind: 'dialogue', title: '', lines: [emptyLine()] };
    case 'deck':
      return { id, type, name: 'Bộ thẻ mới', cards: [emptyCard()] };
    case 'video':
      return { id, type, file: null, caption: '', youtube: null };
    default:
      return { id, type, file: null, caption: '' };
  }
}
export const emptyWord = (): VocabWord => ({
  hanzi: '',
  pinyin: '',
  pos: '',
  meaning: '',
  example: '',
});
export const emptyExample = (): GrammarExample => ({ sentence: '', pinyin: '', meaning: '' });
export const emptyLine = (): DialogueLine => ({
  speaker: '',
  hanzi: '',
  pinyin: '',
  translation: '',
});
export const emptyCard = (): Card => ({
  id: newBlockId(),
  front: '',
  pinyin: '',
  meaning: '',
  example: '',
  image: null,
  audio: null,
});

/** AC-1.2: a new step has an empty goal and exactly one empty text block. */
export const newStepContent = (): StepContent => ({ goal: '', blocks: [newBlock('text')] });

/** Files referenced by a step (blocks and cards), for storage and access checks. */
export function stepFileIds(content: StepContent): string[] {
  const ids: string[] = [];
  for (const b of content.blocks) {
    if (isFileBlock(b) && b.file) ids.push(b.file.id);
    if (b.type === 'deck')
      for (const c of b.cards) {
        if (c.image) ids.push(c.image.id);
        if (c.audio) ids.push(c.audio.id);
      }
  }
  return ids;
}

/* ---------- field rules (AC-1.4, AC-4.4, AC-11.4, AC-2.8) ---------- */

export interface FieldProblem {
  /** `title`, `blocks.<k>.words.<i>.hanzi`, `blocks.<k>.cards.<i>.front`… */
  path: string;
  message: string;
  /** incomplete: blocks publishing only; invalid: blocks every save. */
  kind: 'incomplete' | 'invalid';
}

const blank = (s: string) => s.trim() === '';

function hanziField(
  out: FieldProblem[],
  path: string,
  value: string,
  required: string,
  invalid: string,
): void {
  if (blank(value)) out.push({ path, message: required, kind: 'incomplete' });
  else if (!hasHanzi(value)) out.push({ path, message: invalid, kind: 'invalid' });
}
function pinyinField(out: FieldProblem[], path: string, value: string): void {
  const bad = badPinyin(value);
  if (bad) out.push({ path, message: `Pinyin không hợp lệ: ${bad}`, kind: 'invalid' });
}
function requiredField(out: FieldProblem[], path: string, value: string, message: string): void {
  if (blank(value)) out.push({ path, message, kind: 'incomplete' });
}

/** Every field problem of a step, in screen order. */
export function stepProblems(title: string, content: StepContent): FieldProblem[] {
  const out: FieldProblem[] = [];
  if (blank(title))
    out.push({ path: 'title', message: 'Vui lòng nhập tên bước học', kind: 'incomplete' });
  else if ([...title].length > STEP_LIMITS.titleMax)
    out.push({ path: 'title', message: 'Tên bước học tối đa 100 ký tự', kind: 'invalid' });
  content.blocks.forEach((b, k) => {
    const p = `blocks.${k}`;
    switch (b.type) {
      case 'text':
        if (richTextIsEmpty(b.html))
          out.push({ path: `${p}.html`, message: 'Khối văn bản chưa có chữ', kind: 'incomplete' });
        else if (richTextLength(b.html) > STEP_LIMITS.textMax)
          out.push({
            path: `${p}.html`,
            message: 'Khối văn bản tối đa 20.000 ký tự',
            kind: 'invalid',
          });
        break;
      case 'vocab':
        b.words.forEach((w, i) => {
          hanziField(
            out,
            `${p}.words.${i}.hanzi`,
            w.hanzi,
            'Vui lòng nhập chữ Hán',
            'Từ phải có chữ Hán',
          );
          pinyinField(out, `${p}.words.${i}.pinyin`, w.pinyin);
          requiredField(out, `${p}.words.${i}.meaning`, w.meaning, 'Vui lòng nhập nghĩa');
        });
        break;
      case 'grammar':
        requiredField(out, `${p}.name`, b.name, 'Vui lòng nhập tên mẫu câu');
        if (richTextLength(b.explanation) > STEP_LIMITS.explanationMax)
          out.push({
            path: `${p}.explanation`,
            message: 'Giải thích tối đa 5.000 ký tự',
            kind: 'invalid',
          });
        b.examples.forEach((e, i) => pinyinField(out, `${p}.examples.${i}.pinyin`, e.pinyin));
        break;
      case 'dialogue':
        b.lines.forEach((l, i) => {
          hanziField(
            out,
            `${p}.lines.${i}.hanzi`,
            l.hanzi,
            'Vui lòng nhập lời thoại',
            'Lời thoại phải có chữ Hán',
          );
          pinyinField(out, `${p}.lines.${i}.pinyin`, l.pinyin);
        });
        break;
      case 'deck':
        b.cards.forEach((c, i) => {
          hanziField(
            out,
            `${p}.cards.${i}.front`,
            c.front,
            'Vui lòng nhập mặt trước',
            'Mặt trước phải có chữ Hán',
          );
          pinyinField(out, `${p}.cards.${i}.pinyin`, c.pinyin);
          requiredField(out, `${p}.cards.${i}.meaning`, c.meaning, 'Vui lòng nhập nghĩa');
        });
        break;
      default:
        break;
    }
  });
  return out;
}

/** AC-2.8: the message of the first invalid value, or null when the step may be saved. */
export const firstInvalidMessage = (title: string, content: StepContent): string | null =>
  stepProblems(title, content).find((p) => p.kind === 'invalid')?.message ?? null;

/** Problems under a path prefix (a word, a card, a whole block). */
export const problemsUnder = (problems: readonly FieldProblem[], prefix: string): FieldProblem[] =>
  problems.filter((p) => p.path === prefix || p.path.startsWith(`${prefix}.`));

/* ---------- publish readiness (AC-7.1, AC-7.2) ---------- */

export interface StepIssue {
  /** 1-based block number, null for the step itself. */
  block: number | null;
  text: string;
}

const countRows = (problems: readonly FieldProblem[], prefix: string, part: string) =>
  new Set(
    problems
      .filter((p) => p.path.startsWith(`${prefix}.${part}.`))
      .map((p) => p.path.split('.').slice(0, 4).join('.')),
  ).size;

/** Why a step cannot be published, per block, in order (empty = ready). */
export function stepIssues(title: string, content: StepContent): StepIssue[] {
  const issues: StepIssue[] = [];
  const problems = stepProblems(title, content);
  if (blank(title)) issues.push({ block: null, text: 'chưa có tên bước học' });
  else if (problems.some((p) => p.path === 'title'))
    issues.push({ block: null, text: 'tên bước học quá 100 ký tự' });
  if (!content.blocks.length) issues.push({ block: null, text: 'chưa có khối nào' });
  content.blocks.forEach((b, k) => {
    const p = `blocks.${k}`;
    const add = (text: string) =>
      issues.push({ block: k + 1, text: `${BLOCK_LABELS[b.type]}: ${text}` });
    switch (b.type) {
      case 'text':
        if (problemsUnder(problems, p).length) add('chưa có chữ');
        break;
      case 'vocab': {
        const n = countRows(problems, p, 'words');
        if (!b.words.length) add('chưa có từ nào');
        else if (n) add(`${n} từ chưa hợp lệ`);
        break;
      }
      case 'grammar': {
        const n = countRows(problems, p, 'examples');
        if (blank(b.name)) add('chưa có tên mẫu câu');
        if (!b.examples.length) add('chưa có ví dụ');
        else if (n) add(`${n} ví dụ chưa hợp lệ`);
        break;
      }
      case 'dialogue': {
        const n = countRows(problems, p, 'lines');
        if (!b.lines.length) add('chưa có dòng nào');
        else if (n) add(`${n} dòng chưa hợp lệ`);
        break;
      }
      case 'deck': {
        const n = countRows(problems, p, 'cards');
        if (!b.cards.length) add('chưa có thẻ nào');
        else if (n) add(`${n} thẻ chưa hợp lệ`);
        break;
      }
      case 'video':
        if (!b.file && !b.youtube) add('chưa có tệp');
        break;
      default:
        if (!b.file) add('chưa có tệp');
        break;
    }
  });
  return issues;
}

const issueText = (i: StepIssue) => (i.block ? `Khối ${i.block} · ${i.text}` : i.text);
/** "Bước 2 · Khối 3 · Video: chưa có tệp" (AC-7.2). */
export const issueLine = (stepNo: number, i: StepIssue): string =>
  `Bước ${stepNo} · ${issueText(i)}`;
/** The first issue without the step prefix (for "Không thể xuất bản — Chưa hoàn chỉnh: …"), or null when ready. */
export function stepNotReadyReason(title: string, content: unknown): string | null {
  const parsed = stepContentSchema.safeParse(content);
  if (!parsed.success) return 'nội dung không hợp lệ';
  const first = stepIssues(title, parsed.data)[0];
  return first ? issueText(first) : null;
}

/* ---------- wording ---------- */

export const STEP_MESSAGES = {
  emptySection: 'Chưa có bước học nào — bấm “Thêm bước học”.',
  draftLesson:
    'Bài chưa xuất bản — học viên chưa thấy bước học nào của Bài này, kể cả bước đã xuất bản.',
  nameRequired: 'Vui lòng nhập tên bước học',
  maxBlocks: 'Mỗi bước học tối đa 50 khối.',
  maxBlocksDeck: 'Mỗi bước học có tối đa 50 khối',
  maxWords: 'Mỗi khối Từ vựng có tối đa 100 từ',
  maxExamples: 'Mỗi điểm ngữ pháp có tối đa 20 ví dụ',
  maxLines: 'Mỗi khối Hội thoại / Bài khóa có tối đa 100 dòng',
  maxCards: 'Mỗi bộ thẻ có tối đa 200 thẻ',
  deckNeedsWord: 'Danh sách cần ít nhất 1 từ.',
  saveFailed: 'Chưa lưu được. Kiểm tra kết nối và thử lại.',
  uploading: 'Đang tải tệp lên — vui lòng đợi hoặc hủy',
  processing: 'Đang xử lý…',
  processFailed:
    'Không xử lý được tệp. Hãy kiểm tra tệp rồi tải lên lại (video nên ở dạng MP4 H.264).',
  noPractice:
    'Chưa có bộ bài tập nào liên kết với bước này. Liên kết được đặt khi soạn bộ bài tập (T09).',
  youtubeInvalid: 'Chỉ hỗ trợ liên kết video YouTube (youtube.com hoặc youtu.be).',
  youtubeGone: 'Video không còn khả dụng. Hãy báo giáo viên.',
  unavailable: 'Bước học này hiện không còn khả dụng.',
  blockFailed: 'Không tải được nội dung.',
  markOffline: 'Chưa lưu được đánh dấu — sẽ tự thử lại khi có mạng.',
  excelInvalid: 'Chỉ hỗ trợ tệp Excel .xlsx tối đa 5 MB.',
  excelNoValid: 'Tệp không có dòng hợp lệ nào để nhập.',
  draftBanner: 'Nháp — học viên chưa thấy',
  deleteBody: 'Thao tác có hiệu lực ngay và không hoàn tác được.',
} as const;

export const STEP_ERROR_CODES = {
  INVALID_CONTENT: 'INVALID_CONTENT',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  CORRUPT_FILE: 'CORRUPT_FILE',
  PROCESS_FAILED: 'PROCESS_FAILED',
  STORAGE_FULL: 'STORAGE_FULL',
  SECTION_REPLACED: 'SECTION_REPLACED',
  STEP_UNAVAILABLE: 'STEP_UNAVAILABLE',
  EXCEL_INVALID: 'EXCEL_INVALID',
} as const;

export const saveBlockedMessage = (message: string): string => `Chưa lưu được: ${message}`;
export const changedElsewhereAt = (hhmm: string): string =>
  `Nội dung đã được thay đổi ở nơi khác lúc ${hhmm}.`;
export const sectionReplacedAt = (hhmm: string): string =>
  `Phần Bài học đã được thay bằng nội dung AI được duyệt lúc ${hhmm}. Thay đổi chưa lưu của bạn không được giữ.`;
export const publishedNotice = (n: number): string =>
  `Các bước đã xuất bản đang hiển thị với học viên của ${n} lớp. Thay đổi có hiệu lực ngay khi lưu.`;
export const stepVisibleWarning = (n: number): string =>
  `Bước đang hiển thị với học viên của ${n} lớp.`;
export const deckMarksWarning = (m: number): string =>
  `Đánh dấu Đã thuộc/Chưa thuộc của học viên với ${m} bộ thẻ của bước cũng sẽ bị xóa.`;
export const fixWordsMessage = (n: number): string =>
  `Hãy sửa ${n} từ chưa hợp lệ trước khi tạo bộ thẻ.`;
export const uploadFailedMessage = (reason: string): string => `Tải lên thất bại: ${reason}`;
export const notStartedMessage = (ddmmyyyy: string): string =>
  `Lớp chưa bắt đầu. Nội dung sẽ mở từ ngày ${ddmmyyyy}.`;
export const allKnownMessage = (n: number): string => `Bạn đã thuộc tất cả ${n} thẻ.`;
export const deckLine = (n: number): string =>
  `${n} thẻ · lật thẻ: chữ Hán → pinyin, nghĩa · lưu cùng bước học (“Lưu nháp” / “Lưu thay đổi”)`;
export const excelMissingColumn = (col: string): string =>
  `Tệp không đúng mẫu: thiếu cột “${col}”. Hãy dùng file mẫu.`;
export const excelCapacity = (k: number, n: number): string =>
  `Chỉ còn chỗ cho ${k} từ nhưng tệp có ${n} dòng hợp lệ.`;
export const excelAdded = (n: number): string => `Đã thêm ${n} từ. Hãy lưu để giữ thay đổi.`;

/** AC-19.1 – AC-19.3: the Bài học part of the AI approval confirmation (shown by 010 on T20). */
export function replaceConfirmation(input: {
  lessonName: string;
  lessonPublished: boolean;
  newCount: number;
  old: { published: number; draft: number; archived: number; titles: string[] };
  audience: number;
  decks: number;
  linkedSets: number;
}): { title: string; lines: string[] } {
  const { old } = input;
  const k = old.published + old.draft + old.archived;
  const lines: string[] = [];
  let title: string;
  if (k === 0) {
    title = `Lưu ${input.newCount} bước học vào phần Bài học của “${input.lessonName}”?`;
  } else {
    title = `Thay toàn bộ ${k} bước học hiện có của phần Bài học (${old.published} Đã xuất bản · ${old.draft} Nháp · ${old.archived} Lưu trữ) bằng ${input.newCount} bước mới? Các bước cũ sẽ bị xóa vĩnh viễn, không hoàn tác.`;
    lines.push(...old.titles);
    if (input.lessonPublished && old.published >= 1 && input.audience >= 1)
      lines.push(`Các bước cũ đang hiển thị với học viên của ${input.audience} lớp.`);
    if (input.decks >= 1)
      lines.push(
        `Đánh dấu Đã thuộc/Chưa thuộc của học viên với ${input.decks} bộ thẻ của các bước cũ cũng sẽ bị xóa.`,
      );
    if (input.linkedSets >= 1)
      lines.push(
        `${input.linkedSets} bộ bài tập đang liên kết với các bước cũ sẽ không còn liên kết với bước nào.`,
      );
  }
  lines.push(
    input.lessonPublished
      ? 'Các bước mới được xuất bản ngay: học viên thấy các bước này khi Bài đã xuất bản và phần Bài học không bị ẩn trong lớp.'
      : 'Bài chưa xuất bản — học viên sẽ thấy các bước mới khi Bài được xuất bản.',
  );
  return { title, lines };
}

/* ---------- API shapes ---------- */

export const storageSchema = z.object({ usedBytes: z.number(), quotaBytes: z.number() });
export type Storage = z.infer<typeof storageSchema>;

export const practiceSetSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
});
export type PracticeSet = z.infer<typeof practiceSetSchema>;

/** T07 side data: audience N (AC-7.4, AC-8.1), storage (AC-5.5), practice sets per step (AC-10.1). */
export const stepsInfoSchema = z.object({
  audience: z.number(),
  storage: storageSchema,
  practice: z.record(z.string(), z.array(practiceSetSchema)),
});
export type StepsInfo = z.infer<typeof stepsInfoSchema>;

export const importRowSchema = z.object({
  line: z.number(),
  hanzi: z.string(),
  pinyin: z.string(),
  pos: z.string(),
  meaning: z.string(),
  example: z.string(),
});
export type ImportRow = z.infer<typeof importRowSchema>;
export const importPreviewSchema = z.object({
  rows: z.array(importRowSchema),
  errors: z.array(z.object({ line: z.number(), reason: z.string() })),
  duplicates: z.array(z.object({ line: z.number(), hanzi: z.string(), pinyin: z.string() })),
});
export type ImportPreview = z.infer<typeof importPreviewSchema>;

export const cardMarkSchema = z.enum(['known', 'unknown']);
export type CardMark = z.infer<typeof cardMarkSchema>;
export const markBodySchema = z.object({
  classId: z.string().regex(/^[a-f0-9]{24}$/i),
  stepId: z.string().regex(/^[a-f0-9]{24}$/i),
  deckId: blockId,
  cardId: blockId,
  mark: cardMarkSchema,
});
export type MarkBody = z.infer<typeof markBodySchema>;

/** S03: a practice button (AC-10.3): open → S05, done → S06, closed → disabled "Chưa mở". */
export const learnPracticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.enum(['open', 'done', 'closed']),
});
const neighbourSchema = z.object({ id: z.string(), title: z.string() }).nullable();

export const learnStepSchema = z.object({
  classId: z.string(),
  lesson: z.object({ id: z.string(), name: z.string() }),
  step: z.object({
    id: z.string(),
    title: z.string(),
    goal: z.string(),
    blocks: z.array(blockSchema),
  }),
  position: z.number(),
  total: z.number(),
  prev: neighbourSchema,
  next: neighbourSchema,
  practice: z.array(learnPracticeSchema),
  /** The caller's own marks by card id (AC-16.7). */
  marks: z.record(z.string(), cardMarkSchema),
});
export type LearnStep = z.infer<typeof learnStepSchema>;
