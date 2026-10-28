import { z } from 'zod';
import { numberedToToneMarks, stripTones, toneVowelIndex } from './pinyin.js';
import { type FieldProblem, type FileRef, fileRefSchema, newBlockId } from './steps.js';

/* Module 005 contracts: exercise-set content (9 question kinds), field / completeness rules, answer matching, grading. */

export const EXERCISE_LIMITS = {
  titleMax: 150,
  instructionsMax: 2000,
  questionsPerSet: 100,
  promptMax: 2000,
  explanationMax: 2000,
  optionsMin: 2,
  optionsMax: 6,
  optionMax: 200,
  wordMax: 20,
  wordPinyinMax: 60,
  meaningMax: 200,
  clozeTextMax: 3000,
  blanksMax: 20,
  blankAnswersMax: 10,
  blankAnswerMax: 50,
  headMax: 30,
  pairsMin: 2,
  pairsMax: 8,
  distractorsMax: 4,
  matchItemMax: 100,
  tilesMin: 2,
  tilesMax: 12,
  tileMax: 20,
  alternativesMax: 4,
  writePinyinMax: 100,
  hintMax: 200,
  writeAnswersMax: 5,
  writeAnswerMax: 30,
  passageMax: 5000,
  passagePinyinMax: 10_000,
  subsMax: 10,
  pointsMin: 0.5,
  pointsMax: 100,
  imageMaxBytes: 5 * 1024 * 1024,
} as const;

/** Exact UI wording of spec 005 (the API sends these as `error.message`). */
export const EXERCISE_MESSAGES = {
  titleInvalid: 'Tiêu đề bắt buộc, tối đa 150 ký tự',
  pointsInvalid: 'Điểm phải từ 0,5 đến 100 và theo bước 0,5',
  questionLimit: 'Mỗi bộ bài tập có tối đa 100 câu hỏi',
  lastQuestion: 'Bộ bài tập cần ít nhất 1 câu hỏi.',
  needQuestion: 'Bộ bài tập cần ít nhất 1 câu hỏi để xuất bản',
  needStem: 'Câu hỏi cần có đề bài (chữ hoặc hình ảnh)',
  optionCount: 'Câu trắc nghiệm cần từ 2 đến 6 phương án',
  oneCorrect: 'Hãy chọn đúng 1 đáp án đúng',
  someCorrect: 'Hãy chọn ít nhất 1 đáp án đúng',
  needWord: 'Hãy nhập Từ (chữ Hán)',
  needWordHint: 'Hãy nhập Pinyin hoặc Nghĩa của từ',
  wordHanzi: 'Từ chỉ được chứa chữ Hán',
  clozeShape: 'Đoạn văn cần từ 1 đến 20 chỗ trống và không quá 3000 ký tự',
  pairCount: 'Câu nối cặp cần từ 2 đến 8 cặp',
  tileShape: 'Câu sắp xếp cần từ 2 đến 12 mảnh, mỗi mảnh 1–20 ký tự',
  needWritePinyin: 'Hãy nhập Pinyin đề',
  readingShape: 'Câu đọc hiểu cần đoạn đọc và ít nhất 1 câu hỏi con',
  imageInvalid: 'Ảnh phải là JPG, PNG, WebP hoặc GIF, tối đa 5 MB',
  uploadFailed: 'Tải tệp lên thất bại',
  chooseAll: 'Chọn tất cả đáp án đúng',
  writeHelp: 'Gõ chữ Hán bằng bàn phím tiếng Trung (pinyin hoặc viết tay) của thiết bị',
} as const;

export const EXERCISE_ERROR_CODES = {
  /** 422: a field rule is broken (AC-12.14) or an image is not a file of the workspace. */
  INVALID_CONTENT: 'INVALID_CONTENT',
  /** 409: structure change on a set with submissions (AC-18.1). */
  SET_LOCKED: 'SET_LOCKED',
  /** 409: the save changes scores, `details.count` submissions (AC-19.2). */
  REGRADE_REQUIRED: 'REGRADE_REQUIRED',
  /** 409: the attempt was submitted elsewhere (AC-14.9, AC-17.7). */
  ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
  /** 409: no current deadline in the class (AC-23.9). */
  NOT_OPEN: 'NOT_OPEN',
  /** 422: submit with nothing answered (AC-15.2). */
  NOTHING_ANSWERED: 'NOTHING_ANSWERED',
} as const;

export const saveRefusedMessage = (message: string): string => `Chưa lưu được: ${message}`;

/** AC-19.2: the confirmation before a save that changes scores; AC-19.6: while it runs. */
export const regradeQuestion = (n: number): string =>
  `Thay đổi này làm thay đổi điểm của ${n} bài nộp. Chấm lại và lưu?`;
export const REGRADE_IMPACT = 'Điểm của bài nộp và điểm xếp hạng được tính lại ở mọi lớp.';
export const regradeProgress = (done: number, n: number): string =>
  `Đang chấm lại ${done}/${n} bài nộp…`;

/** AC-18.5: "<tiêu đề gốc> (bản sao)", the original cut so the whole stays within the title limit. */
export const setCopyTitle = (title: string): string =>
  [...title]
    .slice(0, L.titleMax - ' (bản sao)'.length)
    .join('')
    .trimEnd() + ' (bản sao)';

/** AC-18.2: the banner of a set with submissions (its first sentence is also the refusal of a structure change). */
export const lockedRule = (n: number): string =>
  `Đã có ${n} bài nộp: không thêm, xóa, sắp xếp câu hoặc đổi điểm.`;
export const lockedBanner = (n: number): string =>
  `${lockedRule(n)} Sửa đáp án sẽ hỏi “Chấm lại và lưu”.`;

export const optionLabel = (k: number): string => 'ABCDEF'.charAt(k);
export const optionEmpty = (label: string): string => `Phương án ${label} đang trống`;
export const optionDuplicate = (label: string, other: string): string =>
  `Phương án ${label} trùng với phương án ${other}`;
export const optionHanzi = (label: string): string => `Phương án ${label} chỉ được chứa chữ Hán`;
export const pinyinInvalid = (part: string): string => `Pinyin không hợp lệ: ${part}`;
export const writePinyinInvalid = (part: string): string => `Pinyin đề không hợp lệ: ${part}`;
export const blankNoAnswer = (n: number): string => `Chỗ trống ${n} chưa có đáp án được chấp nhận`;
export const pairEmpty = (n: number, column: 'A' | 'B'): string =>
  `Cặp ${n}: mục Cột ${column} đang trống`;
export const distractorEmpty = (n: number): string => `Mục nhiễu ${n} đang trống`;
export const columnDuplicate = (column: 'A' | 'B', text: string): string =>
  `Cột ${column} có mục trùng nhau: ${text}`;
export const alternativeDuplicate = (n: number): string =>
  `Thứ tự chấp nhận ${n} trùng với câu đúng hoặc một thứ tự khác`;
export const writeAnswerEmpty = (n: number): string => `Đáp án ${n} đang trống`;
export const writeAnswerHanzi = (n: number): string => `Đáp án ${n} chỉ được chứa chữ Hán`;

/* ---------- pinyin syllables (AC-7.4) ---------- */

const J_FINALS = 'i ia ian iang iao ie in ing iong iu u uan ue un';
const GKH_FINALS = 'a ai an ang ao e ei en eng ong ou u ua uai uan uang ui un uo';

/** Finals by initial ('' = no initial); ü is written as such, j/q/x/y write it as u. */
const FINALS_BY_INITIAL: Record<string, string> = {
  '': 'a ai an ang ao e ei en eng er o ou',
  b: 'a ai an ang ao ei en eng i ian iao ie in ing o u',
  p: 'a ai an ang ao ei en eng i ian iao ie in ing o ou u',
  m: 'a ai an ang ao e ei en eng i ian iao ie in ing iu o ou u',
  f: 'a an ang ei en eng o ou u',
  d: 'a ai an ang ao e ei en eng i ia ian iao ie ing iu ong ou u uan ui un uo',
  t: 'a ai an ang ao e eng i ian iao ie ing ong ou u uan ui un uo',
  n: 'a ai an ang ao e ei en eng i ian iang iao ie in ing iu ong ou u uan un uo ü üe',
  l: 'a ai an ang ao e ei eng i ia ian iang iao ie in ing iu o ong ou u uan un uo ü üe',
  g: GKH_FINALS,
  k: GKH_FINALS,
  h: GKH_FINALS,
  j: J_FINALS,
  q: J_FINALS,
  x: J_FINALS,
  zh: 'a ai an ang ao e ei en eng i ong ou u ua uai uan uang ui un uo',
  ch: 'a ai an ang ao e en eng i ong ou u ua uai uan uang ui un uo',
  sh: 'a ai an ang ao e ei en eng i ou u ua uai uan uang ui un uo',
  r: 'an ang ao e en eng i ong ou u ua uan ui un uo',
  z: 'a ai an ang ao e ei en eng i ong ou u uan ui un uo',
  c: 'a ai an ang ao e en eng i ong ou u uan ui un uo',
  s: 'a ai an ang ao e en eng i ong ou u uan ui un uo',
  y: 'a an ang ao e i in ing o ong ou u uan ue un',
  w: 'a ai an ang ei en eng o u',
};

const SYLLABLES = new Set(
  Object.entries(FINALS_BY_INITIAL).flatMap(([initial, finals]) =>
    finals.split(' ').map((f) => initial + f),
  ),
);

/** A toneless, lower-case syllable (ü spelled ü), with an optional erhua "r". */
const isSyllable = (s: string): boolean =>
  SYLLABLES.has(s) || (s.length > 1 && s.endsWith('r') && SYLLABLES.has(s.slice(0, -1)));

const LETTERS = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüv]+$/;
const isMarked = (ch: string): boolean => stripTones(ch) !== ch;

/** One syllable as typed: valid base, at most one tone mark, placed on the right vowel. */
function validUnit(unit: string): boolean {
  const base = stripTones(unit).replace(/v/g, 'ü');
  if (!isSyllable(base)) return false;
  const marked = [...unit].flatMap((ch, i) => (isMarked(ch) ? [i] : []));
  if (marked.length === 0) return true;
  if (marked.length > 1) return false;
  const core = SYLLABLES.has(base) ? base : base.slice(0, -1);
  return marked[0] === toneVowelIndex(core);
}

/** Whether a lower-case chunk splits into syllables, each optionally followed by a tone number 1–5. */
function splitsIntoSyllables(p: string): boolean {
  const memo = new Map<number, boolean>();
  const go = (i: number): boolean => {
    if (i === p.length) return true;
    const hit = memo.get(i);
    if (hit !== undefined) return hit;
    let ok = false;
    for (let len = Math.min(7, p.length - i); len >= 1 && !ok; len--) {
      const unit = p.slice(i, i + len);
      if (!LETTERS.test(unit) || !validUnit(unit)) continue;
      // A syllable starting with a / o / e right after another one needs an apostrophe (Xī'ān), unless a tone number
      // already ends the previous syllable.
      if (i > 0 && !/[1-5]/.test(p.charAt(i - 1)) && /^[aoe]/.test(stripTones(unit))) continue;
      const next = p.charAt(i + len);
      if (/[1-5]/.test(next)) ok = ![...unit].some(isMarked) && go(i + len + 1);
      else ok = go(i + len);
    }
    // Erhua written after the tone number: "na3r".
    if (!ok && p.charAt(i) === 'r' && /[1-5]/.test(p.charAt(i - 1))) ok = go(i + 1);
    memo.set(i, ok);
    return ok;
  };
  return go(0);
}

/**
 * AC-7.4: the first part of a pinyin field that is not valid pinyin, or null. Punctuation is dropped; parts are split
 * on spaces, apostrophes and hyphens; capitals and erhua are allowed; tone marks and tone numbers may not be mixed.
 */
export function pinyinProblem(value: string): string | null {
  const parts = value
    .normalize('NFC')
    .replace(/u:/g, 'ü')
    .replace(/U:/g, 'Ü')
    .split(/[\s'’‘\-‐–—]+/);
  for (const raw of parts) {
    const part = raw.replace(/\p{P}/gu, '');
    if (part && !splitsIntoSyllables(part.toLowerCase())) return part;
  }
  return null;
}

/** AC-7.2, AC-7.5: tone numbers right after a syllable become tone marks (5 = neutral); spacing and case are kept. */
export function pinyinNumbersToMarks(s: string): string {
  return s
    .replace(/u:/g, 'ü')
    .replace(/U:/g, 'Ü')
    .replace(/([A-Za-zÜüVv]+)([1-5])/g, (m, run: string, tone: string) => {
      const lower = run.toLowerCase().replace(/v/g, 'ü');
      for (let k = Math.max(0, run.length - 7); k < run.length; k++) {
        if (isSyllable(lower.slice(k)))
          return run.slice(0, k) + numberedToToneMarks(run.slice(k) + tone);
      }
      return m;
    });
}

/* ---------- answer matching (AC-7.1 – AC-7.3, AC-10.5) ---------- */

/**
 * Comparison key of a typed answer: NFC, full-width Latin / digits / punctuation to half-width, no whitespace,
 * Latin lower-cased, tone numbers to tone marks, v = ü. Tones and Hanzi are kept as they are.
 */
export function normalizeAnswer(s: string): string {
  const half = s
    .normalize('NFC')
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
    .toLowerCase();
  return pinyinNumbersToMarks(half).replace(/v/g, 'ü').replace(/\s+/g, '').normalize('NFC');
}

/** An answer counts only when it is not empty after normalisation and equals one accepted answer. */
export function matchesAccepted(answer: string, accepted: readonly string[]): boolean {
  const key = normalizeAnswer(answer);
  return key !== '' && accepted.some((a) => normalizeAnswer(a) === key);
}

const dropPunctuation = (s: string) => s.replace(/\p{P}/gu, '');

/** AC-10.5: Hanzi answers ignore Chinese and Latin punctuation. */
export const matchesHanzi = (answer: string, accepted: readonly string[]): boolean =>
  matchesAccepted(dropPunctuation(answer), accepted.map(dropPunctuation));

const HAN = /\p{Script=Han}/u;
const CN_PUNCT =
  /[\u3000-\u303F\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\u2018\u2019\u201C\u201D\u2026\u2014\u00B7]/;

/** AC-5.3, AC-10.3: only Hanzi and Chinese punctuation (spaces ignored), with at least one Hanzi. */
export function onlyHanzi(s: string): boolean {
  const chars = [...s.replace(/\s+/g, '')];
  return chars.some((c) => HAN.test(c)) && chars.every((c) => HAN.test(c) || CN_PUNCT.test(c));
}

/* ---------- question kinds ---------- */

export const QUESTION_KINDS = [
  'mcq',
  'vocab-meaning',
  'vocab-hanzi',
  'vocab-pinyin',
  'cloze',
  'match',
  'order',
  'write',
  'reading',
] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

/** "Thêm câu hỏi" menu entries (AC-2.1). */
export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  mcq: 'Trắc nghiệm',
  'vocab-meaning': 'Trắc nghiệm từ vựng – Chọn nghĩa',
  'vocab-hanzi': 'Trắc nghiệm từ vựng – Chọn chữ Hán',
  'vocab-pinyin': 'Trắc nghiệm từ vựng – Chọn pinyin',
  cloze: 'Điền chỗ trống',
  match: 'Nối cặp',
  order: 'Sắp xếp từ thành câu',
  write: 'Viết chữ Hán theo pinyin',
  reading: 'Đọc hiểu',
};

/** Short names shown on S06 in place of the question text (AC-16.2). */
export const QUESTION_KIND_SHORT: Record<QuestionKind, string> = {
  mcq: 'Trắc nghiệm',
  'vocab-meaning': 'Chọn nghĩa',
  'vocab-hanzi': 'Chọn chữ Hán',
  'vocab-pinyin': 'Chọn pinyin',
  cloze: 'Điền chỗ trống',
  match: 'Nối cặp',
  order: 'Sắp xếp câu',
  write: 'Viết chữ Hán',
  reading: 'Đọc hiểu',
};

export const VOCAB_VARIANTS = ['meaning', 'hanzi', 'pinyin'] as const;
export type VocabVariant = (typeof VOCAB_VARIANTS)[number];

/** Pre-filled prompts of the vocabulary variants (AC-5.1). */
export const VOCAB_PROMPTS: Record<VocabVariant, string> = {
  meaning: 'Chọn nghĩa đúng của từ',
  hanzi: 'Chọn chữ Hán đúng',
  pinyin: 'Chọn pinyin đúng',
};

/* ---------- content schemas ---------- */

const L = EXERCISE_LIMITS;
const partId = z.string().min(1).max(40);
const str = (max: number) => z.string().max(max).default('');
const points = z.number().finite().default(1);
const image = fileRefSchema.nullable().default(null);

const stem = {
  id: partId,
  prompt: str(L.promptMax),
  image,
  explanation: str(L.explanationMax),
  /** "AI tạo" (GV only, AC-13.1). */
  ai: z.boolean().default(false),
};

export const optionSchema = z.object({
  id: partId,
  text: str(L.optionMax),
  image,
  correct: z.boolean().default(false),
});
export type Option = z.infer<typeof optionSchema>;

export const mcqQuestionSchema = z.object({
  ...stem,
  type: z.literal('mcq'),
  multi: z.boolean().default(false),
  options: z.array(optionSchema).max(L.optionsMax),
  points,
});
export type McqQuestion = z.infer<typeof mcqQuestionSchema>;

export const vocabQuestionSchema = z.object({
  ...stem,
  type: z.literal('vocab'),
  variant: z.enum(VOCAB_VARIANTS),
  word: str(L.wordMax),
  wordPinyin: str(L.wordPinyinMax),
  meaning: str(L.meaningMax),
  options: z.array(optionSchema).max(L.optionsMax),
  points,
});
export type VocabQuestion = z.infer<typeof vocabQuestionSchema>;

export const blankSchema = z.object({
  id: partId,
  answers: z.array(z.string().max(L.blankAnswerMax)).max(L.blankAnswersMax),
  points,
});
export type Blank = z.infer<typeof blankSchema>;

/** The passage holds one `[[<blank id>]]` token per blank. */
export const clozeQuestionSchema = z.object({
  ...stem,
  type: z.literal('cloze'),
  text: str(10_000),
  blanks: z.array(blankSchema).max(50),
});
export type ClozeQuestion = z.infer<typeof clozeQuestionSchema>;

/** `bId` identifies the Cột B item, which moves with its text on "Hoán đổi" (AC-8.3, AC-18.3). */
export const pairSchema = z.object({
  id: partId,
  a: str(L.matchItemMax),
  b: str(L.matchItemMax),
  bId: partId,
  points,
});
export type Pair = z.infer<typeof pairSchema>;

export const matchQuestionSchema = z.object({
  ...stem,
  type: z.literal('match'),
  headA: z.string().max(L.headMax).default('Cột A'),
  headB: z.string().max(L.headMax).default('Cột B'),
  pairs: z.array(pairSchema).max(L.pairsMax),
  distractors: z.array(z.object({ id: partId, text: str(L.matchItemMax) })).max(L.distractorsMax),
});
export type MatchQuestion = z.infer<typeof matchQuestionSchema>;

/** Tiles in the order of the correct sentence; each accepted order lists every tile id. */
export const orderQuestionSchema = z.object({
  ...stem,
  type: z.literal('order'),
  tiles: z.array(z.object({ id: partId, text: str(100) })).max(30),
  alternatives: z.array(z.array(partId).max(30)).max(L.alternativesMax),
  points,
});
export type OrderQuestion = z.infer<typeof orderQuestionSchema>;

export const writeQuestionSchema = z.object({
  ...stem,
  type: z.literal('write'),
  pinyin: str(L.writePinyinMax),
  hint: str(L.hintMax),
  answers: z.array(z.string().max(L.writeAnswerMax)).max(L.writeAnswersMax),
  points,
});
export type WriteQuestion = z.infer<typeof writeQuestionSchema>;

export const subQuestionSchema = z.discriminatedUnion('type', [
  mcqQuestionSchema,
  clozeQuestionSchema,
]);
export type SubQuestion = z.infer<typeof subQuestionSchema>;

export const readingQuestionSchema = z.object({
  ...stem,
  type: z.literal('reading'),
  passage: str(L.passageMax),
  passagePinyin: str(L.passagePinyinMax),
  subs: z.array(subQuestionSchema).max(L.subsMax),
});
export type ReadingQuestion = z.infer<typeof readingQuestionSchema>;

export const questionSchema = z.discriminatedUnion('type', [
  mcqQuestionSchema,
  vocabQuestionSchema,
  clozeQuestionSchema,
  matchQuestionSchema,
  orderQuestionSchema,
  writeQuestionSchema,
  readingQuestionSchema,
]);
export type Question = z.infer<typeof questionSchema>;

/** Interim 002 sets (`{ type: 'mcq', prompt, options: string[], answer }`, no ids) are upgraded on read. */
function upgradeSet(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const c = raw as { questions?: unknown };
  if (!Array.isArray(c.questions)) return raw;
  return {
    instructions: '',
    stepId: null,
    ...c,
    questions: c.questions.map((q: unknown, i: number) => {
      if (!q || typeof q !== 'object') return q;
      const old = q as Record<string, unknown>;
      const id = typeof old['id'] === 'string' ? old['id'] : `q${i}`;
      const options = old['options'];
      if (old['type'] !== 'mcq' || !Array.isArray(options) || typeof options[0] !== 'string')
        return { ...old, id };
      return {
        id,
        type: 'mcq',
        prompt: old['prompt'] ?? '',
        options: options.map((text: unknown, k: number) => ({
          id: `${id}o${k}`,
          text,
          correct: old['answer'] === k,
        })),
      };
    }),
  };
}

const PUBLIC_ID = /^[a-f0-9]{24}$/i;

export const exerciseSetContentSchema = z.preprocess(
  upgradeSet,
  z
    .object({
      instructions: str(L.instructionsMax),
      /** "Bước học liên kết" (AC-1.3), null = "Không liên kết". */
      stepId: z.string().regex(PUBLIC_ID).nullable().default(null),
      questions: z.array(questionSchema).max(L.questionsPerSet),
    })
    .superRefine((c, ctx) => {
      const seen = new Set<string>();
      for (const id of partIds(c.questions)) {
        if (seen.has(id)) ctx.addIssue({ code: 'custom', message: `Mã trùng: ${id}` });
        seen.add(id);
      }
    }),
);
export type ExerciseSetContent = z.infer<typeof exerciseSetContentSchema>;

/** Every id of questions and their parts (answers are bound to them, AC-18.3). */
function partIds(questions: readonly (Question | SubQuestion)[]): string[] {
  return questions.flatMap((q): string[] => {
    switch (q.type) {
      case 'mcq':
      case 'vocab':
        return [q.id, ...q.options.map((o) => o.id)];
      case 'cloze':
        return [q.id, ...q.blanks.map((b) => b.id)];
      case 'match':
        return [q.id, ...q.pairs.flatMap((p) => [p.id, p.bId]), ...q.distractors.map((d) => d.id)];
      case 'order':
        return [q.id, ...q.tiles.map((t) => t.id)];
      case 'write':
        return [q.id];
      case 'reading':
        return [q.id, ...partIds(q.subs)];
    }
  });
}

/** Images used by a set (storage, AC-3.5). */
export function setFileIds(content: ExerciseSetContent): string[] {
  const of = (q: Question | SubQuestion): FileRef[] => {
    const own = q.image ? [q.image] : [];
    if (q.type === 'mcq' || q.type === 'vocab')
      return [...own, ...q.options.flatMap((o) => (o.image ? [o.image] : []))];
    if (q.type === 'reading') return [...own, ...q.subs.flatMap(of)];
    return own;
  };
  return [...new Set(content.questions.flatMap(of).map((f) => f.id))];
}

export const questionKind = (q: Question | SubQuestion): QuestionKind =>
  q.type === 'vocab' ? `vocab-${q.variant}` : q.type;

/* ---------- new content (AC-1.1, AC-2.1, AC-5.1) ---------- */

export const newOption = (): Option => ({
  id: newBlockId(),
  text: '',
  image: null,
  correct: false,
});
const stemOf = (prompt = '') => ({
  id: newBlockId(),
  prompt,
  image: null,
  explanation: '',
  ai: false,
});

export const newMcq = (): McqQuestion => ({
  ...stemOf(),
  type: 'mcq',
  multi: false,
  options: [newOption(), newOption()],
  points: 1,
});
export const newCloze = (): ClozeQuestion => ({
  ...stemOf('Điền vào chỗ trống.'),
  type: 'cloze',
  text: '',
  blanks: [],
});
export const newPair = (): Pair => ({
  id: newBlockId(),
  a: '',
  b: '',
  bId: newBlockId(),
  points: 1,
});
export const newTile = (text: string) => ({ id: newBlockId(), text });

/** A new question of `kind`, with 1 point for the question, each blank, pair or sub-question (AC-2.1). */
export function newQuestion(kind: QuestionKind): Question {
  switch (kind) {
    case 'mcq':
      return newMcq();
    case 'vocab-meaning':
    case 'vocab-hanzi':
    case 'vocab-pinyin': {
      const variant = kind.slice(6) as VocabVariant;
      return {
        ...stemOf(VOCAB_PROMPTS[variant]),
        type: 'vocab',
        variant,
        word: '',
        wordPinyin: '',
        meaning: '',
        options: [newOption(), newOption()],
        points: 1,
      };
    }
    case 'cloze':
      return newCloze();
    case 'match':
      return {
        ...stemOf('Nối các mục tương ứng.'),
        type: 'match',
        headA: 'Cột A',
        headB: 'Cột B',
        pairs: [newPair(), newPair()],
        distractors: [],
      };
    case 'order':
      return {
        ...stemOf('Sắp xếp thành câu.'),
        type: 'order',
        tiles: [newTile(''), newTile('')],
        alternatives: [],
        points: 1,
      };
    case 'write':
      return { ...stemOf(), type: 'write', pinyin: '', hint: '', answers: [''], points: 1 };
    case 'reading':
      return {
        ...stemOf('Đọc đoạn văn rồi trả lời.'),
        type: 'reading',
        passage: '',
        passagePinyin: '',
        subs: [newMcq()],
      };
  }
}

/** AC-1.1: a new set has no instructions, no linked step and one sample multiple-choice question. */
export const newSetContent = (): ExerciseSetContent => ({
  instructions: '',
  stepId: null,
  questions: [newMcq()],
});

/** AC-9.1: "我/是/越南/人" → tiles. */
export const tilesFromSentence = (input: string) =>
  input
    .split('/')
    .map((t) => t.trim())
    .filter(Boolean)
    .map(newTile);

/* ---------- cloze blanks (AC-6.1) ---------- */

const BLANK_TOKEN = /\[\[([A-Za-z0-9_-]{1,40})\]\]/g;
export const blankToken = (id: string): string => `[[${id}]]`;

export type ClozeSegment =
  { kind: 'text'; text: string } | { kind: 'blank'; id: string; n: number };

/** The passage as text and numbered blanks, in order of appearance. */
export function clozeSegments(text: string): ClozeSegment[] {
  const out: ClozeSegment[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (const m of text.matchAll(BLANK_TOKEN)) {
    const id = m[1] ?? '';
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
    if (!seen.has(id)) {
      seen.add(id);
      out.push({ kind: 'blank', id, n: seen.size });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

/** The blanks present in the passage, in order of appearance. */
export function clozeBlanks(q: ClozeQuestion): Blank[] {
  const byId = new Map(q.blanks.map((b) => [b.id, b]));
  return clozeSegments(q.text).flatMap((s) => {
    const b = s.kind === 'blank' ? byId.get(s.id) : undefined;
    return b ? [b] : [];
  });
}

/** AC-6.1: the selected part of the passage becomes a blank whose first accepted answer is that part. */
export function markBlank(q: ClozeQuestion, start: number, end: number): ClozeQuestion {
  const picked = q.text.slice(start, end).trim();
  if (!picked || /\[\[|\]\]/.test(picked)) return q;
  const blank: Blank = { id: newBlockId(), answers: [picked], points: 1 };
  return {
    ...q,
    text: q.text.slice(0, start) + blankToken(blank.id) + q.text.slice(end),
    blanks: [...q.blanks, blank],
  };
}

/** Turns a blank back into text (its first accepted answer). */
export function unmarkBlank(q: ClozeQuestion, id: string): ClozeQuestion {
  const first = q.blanks.find((b) => b.id === id)?.answers[0] ?? '';
  return {
    ...q,
    text: q.text.split(blankToken(id)).join(first),
    blanks: q.blanks.filter((b) => b.id !== id),
  };
}

/** Passage length as the GV sees it (each blank counts as its first accepted answer). */
const clozeLength = (q: ClozeQuestion): number => {
  const first = new Map(q.blanks.map((b) => [b.id, b.answers[0] ?? '']));
  return [...q.text.replace(BLANK_TOKEN, (_m, id: string) => first.get(id) ?? '')].length;
};

/* ---------- points (AC-2.3, AC-2.4) ---------- */

export const validPoints = (v: number): boolean =>
  Number.isFinite(v) && v >= L.pointsMin && v <= L.pointsMax && Number.isInteger(v * 2);

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/** Maximum points of a question: its own points, or the sum of its blanks, pairs or sub-questions. */
export function questionPoints(q: Question | SubQuestion): number {
  switch (q.type) {
    case 'cloze':
      return sum(clozeBlanks(q).map((b) => b.points));
    case 'match':
      return sum(q.pairs.map((p) => p.points));
    case 'reading':
      return sum(q.subs.map(questionPoints));
    default:
      return q.points;
  }
}

export const setPoints = (content: ExerciseSetContent): number =>
  sum(content.questions.map(questionPoints));

/* ---------- field and completeness rules (AC-2.6, AC-2.7, AC-12.3) ---------- */

export interface ExerciseProblem extends FieldProblem {
  /** "3" or "3.2" (sub-question); null for the set itself. */
  question: string | null;
  /** Field or option named in the publish issue, e.g. "Pinyin của từ" (AC-5.4). */
  context?: string;
}

const blank = (s: string) => s.trim() === '';
const sameText = (a: string, b: string) => normalizeAnswer(a) === normalizeAnswer(b);

/** Index of an earlier entry with the same text (empty entries never match), per entry. */
const firstDuplicate = (texts: readonly string[]): number[] =>
  texts.map((t, k) => (blank(t) ? -1 : texts.findIndex((x, j) => j < k && sameText(x, t))));

function questionProblems(q: Question | SubQuestion, path: string, n: string): ExerciseProblem[] {
  const out: ExerciseProblem[] = [];
  const add = (p: string, message: string, kind: 'incomplete' | 'invalid', context?: string) =>
    out.push({ path: p, message, kind, question: n, ...(context ? { context } : {}) });
  const pointsRule = (p: string, v: number) => {
    if (!validPoints(v)) add(p, EXERCISE_MESSAGES.pointsInvalid, 'invalid');
  };
  const pinyinRule = (p: string, v: string, context?: string) => {
    const bad = blank(v) ? null : pinyinProblem(v);
    if (bad) add(p, pinyinInvalid(bad), 'invalid', context);
  };

  switch (q.type) {
    case 'mcq':
    case 'vocab': {
      if (q.type === 'mcq' && blank(q.prompt) && !q.image)
        add(`${path}.prompt`, EXERCISE_MESSAGES.needStem, 'incomplete');
      if (q.type === 'vocab') {
        if (q.variant !== 'hanzi') {
          if (blank(q.word)) add(`${path}.word`, EXERCISE_MESSAGES.needWord, 'incomplete');
          else if (!onlyHanzi(q.word)) add(`${path}.word`, EXERCISE_MESSAGES.wordHanzi, 'invalid');
        } else if (blank(q.wordPinyin) && blank(q.meaning)) {
          add(`${path}.wordPinyin`, EXERCISE_MESSAGES.needWordHint, 'incomplete');
        }
        pinyinRule(`${path}.wordPinyin`, q.wordPinyin, 'Pinyin của từ');
      }
      if (q.options.length < L.optionsMin)
        add(`${path}.options`, EXERCISE_MESSAGES.optionCount, 'incomplete');
      const texts = q.options.map((o) => (o.image ? '' : o.text));
      const dup = firstDuplicate(texts);
      q.options.forEach((o, k) => {
        const p = `${path}.options.${k}.text`;
        const label = optionLabel(k);
        if (blank(o.text) && !o.image) add(p, optionEmpty(label), 'incomplete');
        else if (q.type === 'vocab' && q.variant === 'hanzi' && !onlyHanzi(o.text))
          add(p, optionHanzi(label), 'invalid');
        else if (q.type === 'vocab' && q.variant === 'pinyin')
          pinyinRule(p, o.text, `Phương án ${label}`);
        const d = dup[k] ?? -1;
        if (d >= 0) add(p, optionDuplicate(label, optionLabel(d)), 'incomplete');
      });
      const correct = q.options.filter((o) => o.correct).length;
      const multi = q.type === 'mcq' && q.multi;
      if (!multi && correct !== 1)
        add(`${path}.options`, EXERCISE_MESSAGES.oneCorrect, 'incomplete');
      if (multi && correct === 0)
        add(`${path}.options`, EXERCISE_MESSAGES.someCorrect, 'incomplete');
      pointsRule(`${path}.points`, q.points);
      break;
    }
    case 'cloze': {
      const blanks = clozeBlanks(q);
      if (!blanks.length || blanks.length > L.blanksMax || clozeLength(q) > L.clozeTextMax)
        add(`${path}.text`, EXERCISE_MESSAGES.clozeShape, 'incomplete');
      blanks.forEach((b, k) => {
        const i = q.blanks.indexOf(b);
        if (!b.answers.some((a) => !blank(a)))
          add(`${path}.blanks.${i}.answers`, blankNoAnswer(k + 1), 'incomplete');
        pointsRule(`${path}.blanks.${i}.points`, b.points);
      });
      break;
    }
    case 'match': {
      if (q.pairs.length < L.pairsMin || q.pairs.length > L.pairsMax)
        add(`${path}.pairs`, EXERCISE_MESSAGES.pairCount, 'incomplete');
      q.pairs.forEach((p, k) => {
        if (blank(p.a)) add(`${path}.pairs.${k}.a`, pairEmpty(k + 1, 'A'), 'incomplete');
        if (blank(p.b)) add(`${path}.pairs.${k}.b`, pairEmpty(k + 1, 'B'), 'incomplete');
        pointsRule(`${path}.pairs.${k}.points`, p.points);
      });
      q.distractors.forEach((d, k) => {
        if (blank(d.text))
          add(`${path}.distractors.${k}.text`, distractorEmpty(k + 1), 'incomplete');
      });
      const columnA = q.pairs.map((p) => p.a);
      const columnB = [...q.pairs.map((p) => p.b), ...q.distractors.map((d) => d.text)];
      for (const [column, texts] of [
        ['A', columnA],
        ['B', columnB],
      ] as const) {
        const k = firstDuplicate(texts).findIndex((d) => d >= 0);
        if (k >= 0)
          add(`${path}.pairs`, columnDuplicate(column, texts[k]?.trim() ?? ''), 'incomplete');
      }
      break;
    }
    case 'order': {
      const n = q.tiles.length;
      if (
        n < L.tilesMin ||
        n > L.tilesMax ||
        q.tiles.some((t) => blank(t.text) || [...t.text.trim()].length > L.tileMax)
      )
        add(`${path}.tiles`, EXERCISE_MESSAGES.tileShape, 'incomplete');
      const sentences = [
        joinTiles(q.tiles),
        ...q.alternatives.map((a) => joinTiles(tilesByIds(q, a))),
      ];
      sentences.forEach((s, k) => {
        if (k > 0 && sentences.slice(0, k).some((x) => sameText(x, s)))
          add(`${path}.alternatives.${k - 1}`, alternativeDuplicate(k), 'incomplete');
      });
      pointsRule(`${path}.points`, q.points);
      break;
    }
    case 'write': {
      if (blank(q.pinyin)) add(`${path}.pinyin`, EXERCISE_MESSAGES.needWritePinyin, 'incomplete');
      else {
        const bad = pinyinProblem(q.pinyin);
        if (bad) add(`${path}.pinyin`, writePinyinInvalid(bad), 'invalid');
      }
      q.answers.forEach((a, k) => {
        if (blank(a)) add(`${path}.answers.${k}`, writeAnswerEmpty(k + 1), 'incomplete');
        else if (!onlyHanzi(a)) add(`${path}.answers.${k}`, writeAnswerHanzi(k + 1), 'invalid');
      });
      if (!q.answers.length) add(`${path}.answers`, writeAnswerEmpty(1), 'incomplete');
      pointsRule(`${path}.points`, q.points);
      break;
    }
    case 'reading': {
      if (blank(q.passage) || !q.subs.length)
        add(`${path}.passage`, EXERCISE_MESSAGES.readingShape, 'incomplete');
      q.subs.forEach((s, m) =>
        out.push(...questionProblems(s, `${path}.subs.${m}`, `${n}.${m + 1}`)),
      );
      break;
    }
  }
  return out;
}

/** Every problem of a set in screen order: the title, then each question (paths `questions.<i>.…`). */
export function setProblems(title: string, content: ExerciseSetContent): ExerciseProblem[] {
  const out: ExerciseProblem[] = [];
  if (blank(title) || [...title.trim()].length > L.titleMax)
    out.push({
      path: 'title',
      message: EXERCISE_MESSAGES.titleInvalid,
      kind: 'invalid',
      question: null,
    });
  content.questions.forEach((q, i) =>
    out.push(...questionProblems(q, `questions.${i}`, String(i + 1))),
  );
  return out;
}

/** AC-12.14: the first invalid field of a set (blocks every save), or null. */
export const firstInvalidSetProblem = (
  title: string,
  content: ExerciseSetContent,
): ExerciseProblem | null => setProblems(title, content).find((p) => p.kind === 'invalid') ?? null;

/** Problems of one question (or one of its parts) by path prefix. */
export const problemsAt = (
  problems: readonly ExerciseProblem[],
  prefix: string,
): ExerciseProblem[] =>
  problems.filter((p) => p.path === prefix || p.path.startsWith(`${prefix}.`));

/** AC-12.5: why a set cannot be published — "Câu n: …" lines plus the set's own (empty = valid, AC-12.3). */
export function setIssues(title: string, content: ExerciseSetContent): string[] {
  const lines: string[] = [];
  const problems = setProblems(title, content);
  if (problems.some((p) => p.path === 'title')) lines.push(EXERCISE_MESSAGES.titleInvalid);
  if (!content.questions.length) lines.push(EXERCISE_MESSAGES.needQuestion);
  for (const p of problems) {
    if (p.question === null) continue;
    const line = `Câu ${p.question}: ${p.message}${p.context ? ` (${p.context})` : ''}`;
    if (!lines.includes(line)) lines.push(line);
  }
  return lines;
}

/** Why a stored set (raw content) cannot be published, first issue only; null when valid. */
export function setNotReadyReason(title: string, content: unknown): string | null {
  const parsed = exerciseSetContentSchema.safeParse(content);
  if (!parsed.success) return 'nội dung không hợp lệ';
  return setIssues(title, parsed.data)[0] ?? null;
}

/* ---------- sentence ordering helpers (AC-9.1, AC-9.7) ---------- */

/** Tiles of an accepted order (ids that no longer exist are skipped). */
export function tilesByIds(q: OrderQuestion, ids: readonly string[]) {
  const byId = new Map(q.tiles.map((t) => [t.id, t]));
  return ids.flatMap((id) => {
    const t = byId.get(id);
    return t ? [t] : [];
  });
}

/** A sentence from tiles: Hanzi tiles join without spaces, others with one space. */
export function joinTiles(tiles: readonly { text: string }[]): string {
  const texts = tiles.map((t) => t.text.trim());
  return texts.every((t) => HAN.test(t) || CN_PUNCT.test(t)) ? texts.join('') : texts.join(' ');
}

/* ---------- answers (AC-14.3, AC-18.3) ---------- */

const subAnswerShape = {
  /** Chosen option ids (multiple choice). */
  optionIds: z.array(partId).max(L.optionsMax).optional(),
  /** Typed text by blank id (cloze). */
  blanks: z.record(z.string(), z.string().max(L.blankAnswerMax)).optional(),
};
export const subAnswerSchema = z.object(subAnswerShape);
export const answerSchema = z.object({
  ...subAnswerShape,
  /** Cột B item id by pair id (matching). */
  pairs: z.record(z.string(), partId).optional(),
  /** Tile ids on the answer line, in order (ordering). */
  tiles: z.array(partId).max(30).optional(),
  /** Typed Hanzi (write). */
  text: z.string().max(L.writeAnswerMax).optional(),
  /** Answers of the sub-questions by id (reading). */
  subs: z.record(z.string(), subAnswerSchema).optional(),
});
export type Answer = z.infer<typeof answerSchema>;
/** Answers of an attempt by question id. */
export const answersSchema = z.record(z.string(), answerSchema);
export type Answers = z.infer<typeof answersSchema>;

export type AnswerState = 'none' | 'partial' | 'complete';

const filled = (s: string | undefined) => !!s && s.trim() !== '';
const stateOf = (done: number, total: number): AnswerState =>
  done === 0 ? 'none' : done >= total ? 'complete' : 'partial';

/** AC-14.3: unanswered, partly answered or complete (only parts that still exist count). */
export function answerState(q: Question | SubQuestion, a: Answer | undefined): AnswerState {
  if (!a) return 'none';
  switch (q.type) {
    case 'mcq':
    case 'vocab':
      return q.options.some((o) => a.optionIds?.includes(o.id)) ? 'complete' : 'none';
    case 'cloze': {
      const blanks = clozeBlanks(q);
      return stateOf(blanks.filter((b) => filled(a.blanks?.[b.id])).length, blanks.length);
    }
    case 'match': {
      const bIds = new Set([...q.pairs.map((p) => p.bId), ...q.distractors.map((d) => d.id)]);
      const done = q.pairs.filter((p) => bIds.has(a.pairs?.[p.id] ?? '')).length;
      return stateOf(done, q.pairs.length);
    }
    case 'order': {
      const ids = new Set(q.tiles.map((t) => t.id));
      return stateOf(new Set((a.tiles ?? []).filter((id) => ids.has(id))).size, q.tiles.length);
    }
    case 'write':
      return filled(a.text) ? 'complete' : 'none';
    case 'reading': {
      const states = q.subs.map((s) => answerState(s, a.subs?.[s.id]));
      if (states.every((s) => s === 'complete') && states.length) return 'complete';
      return states.some((s) => s !== 'none') ? 'partial' : 'none';
    }
  }
}

/* ---------- grading (REQ-4 … REQ-11, AC-16.1, AC-16.3) ---------- */

export const VERDICTS = ['correct', 'partial', 'wrong', 'unanswered'] as const;
export type Verdict = (typeof VERDICTS)[number];
export const VERDICT_LABELS: Record<Verdict, string> = {
  correct: 'Đúng',
  partial: 'Đúng một phần',
  wrong: 'Sai',
  unanswered: 'Chưa trả lời',
};

export interface GradeResult {
  /** Question, blank, pair or sub-question id. */
  id: string;
  earned: number;
  max: number;
  verdict: Verdict;
  /** Blanks, pairs or sub-questions. */
  parts?: GradeResult[];
}
export const gradeResultSchema: z.ZodType<GradeResult> = z.lazy(() =>
  z.object({
    id: z.string(),
    earned: z.number(),
    max: z.number(),
    verdict: z.enum(VERDICTS),
    parts: z.array(gradeResultSchema).optional(),
  }),
);

/** AC-16.3: full points = Đúng, some = Đúng một phần, none = Sai, nothing given = Chưa trả lời. */
const verdict = (earned: number, max: number, answered: boolean): Verdict =>
  !answered
    ? 'unanswered'
    : earned >= max && max > 0
      ? 'correct'
      : earned > 0
        ? 'partial'
        : 'wrong';

const result = (
  id: string,
  earned: number,
  max: number,
  answered: boolean,
  parts?: GradeResult[],
): GradeResult => ({
  id,
  earned,
  max,
  verdict: verdict(earned, max, answered),
  ...(parts ? { parts } : {}),
});

/** Grades one question with the current key; unknown or removed parts earn nothing. */
export function gradeQuestion(q: Question | SubQuestion, a: Answer | undefined): GradeResult {
  const answered = answerState(q, a) !== 'none';
  switch (q.type) {
    case 'mcq':
    case 'vocab': {
      const chosen = new Set(a?.optionIds ?? []);
      const right = q.options.filter((o) => o.correct).map((o) => o.id);
      const picked = q.options.filter((o) => chosen.has(o.id)).map((o) => o.id);
      const ok =
        right.length > 0 && right.length === picked.length && right.every((id) => chosen.has(id));
      return result(q.id, ok ? q.points : 0, q.points, answered);
    }
    case 'cloze': {
      const parts = clozeBlanks(q).map((b) => {
        const typed = a?.blanks?.[b.id];
        const ok =
          typed !== undefined &&
          matchesAccepted(
            typed,
            b.answers.filter((x) => !blank(x)),
          );
        return result(b.id, ok ? b.points : 0, b.points, filled(typed));
      });
      return result(
        q.id,
        sum(parts.map((p) => p.earned)),
        sum(parts.map((p) => p.max)),
        answered,
        parts,
      );
    }
    case 'match': {
      const parts = q.pairs.map((p) => {
        const chosen = a?.pairs?.[p.id];
        return result(p.id, chosen === p.bId ? p.points : 0, p.points, !!chosen);
      });
      return result(
        q.id,
        sum(parts.map((p) => p.earned)),
        sum(parts.map((p) => p.max)),
        answered,
        parts,
      );
    }
    case 'order': {
      const placed = tilesByIds(q, [...new Set(a?.tiles ?? [])]);
      const accepted = [q.tiles, ...q.alternatives.map((ids) => tilesByIds(q, ids))].map(joinTiles);
      const ok =
        placed.length === q.tiles.length &&
        accepted.some((s) => normalizeAnswer(s) === normalizeAnswer(joinTiles(placed)));
      return result(q.id, ok ? q.points : 0, q.points, answered);
    }
    case 'write': {
      const ok =
        !!a?.text &&
        matchesHanzi(
          a.text,
          q.answers.filter((x) => !blank(x)),
        );
      return result(q.id, ok ? q.points : 0, q.points, answered);
    }
    case 'reading': {
      const parts = q.subs.map((s) => gradeQuestion(s, a?.subs?.[s.id]));
      return result(
        q.id,
        sum(parts.map((p) => p.earned)),
        sum(parts.map((p) => p.max)),
        answered,
        parts,
      );
    }
  }
}

export interface SetGrade {
  score: number;
  maxScore: number;
  results: GradeResult[];
}

/** AC-16.1: every question graded with the current key; unanswered questions earn 0. */
export function gradeSet(content: ExerciseSetContent, answers: Answers): SetGrade {
  const results = content.questions.map((q) => gradeQuestion(q, answers[q.id]));
  return {
    score: sum(results.map((r) => r.earned)),
    maxScore: sum(results.map((r) => r.max)),
    results,
  };
}

/** AC-16.2: percentage rounded half up, like 008 AC-1.2. */
export const scorePercent = (score: number, max: number): number =>
  max > 0 ? Math.floor((score / max) * 100 + 0.5 + 1e-9) : 0;

/* ---------- shuffles (AC-8.4, AC-9.4) ---------- */

/** Column B (matching) or tile bank (ordering) order of one attempt, by question id. */
export type Shuffles = Record<string, string[]>;
export const shufflesSchema = z.record(z.string(), z.array(partId).max(30));

function shuffled<T>(xs: readonly T[], rnd: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** The first random order `ok` accepts (rotations as a fallback), or the authored order when none does. */
function pickOrder(ids: readonly string[], ok: (order: string[]) => boolean, rnd: () => number) {
  for (let k = 0; k < 20; k++) {
    const order = shuffled(ids, rnd);
    if (ok(order)) return order;
  }
  for (let k = 1; k < ids.length; k++) {
    const order = [...ids.slice(k), ...ids.slice(0, k)];
    if (ok(order)) return order;
  }
  return [...ids];
}

/** New shuffles for an attempt: Cột B differs from the pairs' order; the bank never reads as an accepted sentence. */
export function makeShuffles(
  content: ExerciseSetContent,
  rnd: () => number = Math.random,
): Shuffles {
  const out: Shuffles = {};
  for (const q of content.questions) {
    if (q.type === 'match') {
      const ids = [...q.pairs.map((p) => p.bId), ...q.distractors.map((d) => d.id)];
      out[q.id] = pickOrder(ids, (o) => o.some((id, k) => id !== ids[k]), rnd);
    }
    if (q.type === 'order') {
      const accepted = [q.tiles, ...q.alternatives.map((a) => tilesByIds(q, a))].map((t) =>
        normalizeAnswer(joinTiles(t)),
      );
      out[q.id] = pickOrder(
        q.tiles.map((t) => t.id),
        (o) => !accepted.includes(normalizeAnswer(joinTiles(tilesByIds(q, o)))),
        rnd,
      );
    }
  }
  return out;
}

/** AC-18.4: a stored order kept for the ids that still exist, new ids appended. */
export function reconcileOrder(
  stored: readonly string[] | undefined,
  current: readonly string[],
): string[] {
  const now = new Set(current);
  const kept = (stored ?? []).filter((id) => now.has(id));
  return [...kept, ...current.filter((id) => !kept.includes(id))];
}

/* ---------- structure lock and kept answers (AC-18.1, AC-18.4) ---------- */

/**
 * AC-18.1: what a set with submissions may not change — questions and their order, kind and mode, the options, blanks,
 * pairs, Cột B items, tiles and sub-questions (by id), and every points value. Text, images, explanations and the key
 * (correct options, accepted answers, which Cột B item a pair takes, accepted orders) stay editable.
 */
export function setStructure(content: ExerciseSetContent): string {
  const ids = (xs: readonly { id: string }[]) => xs.map((x) => x.id);
  const shape = (q: Question | SubQuestion): unknown[] => {
    const head = [q.id, questionKind(q)];
    switch (q.type) {
      case 'mcq':
        return [...head, q.multi, q.points, ids(q.options)];
      case 'vocab':
        return [...head, q.points, ids(q.options)];
      case 'cloze':
        return [...head, q.blanks.map((b) => [b.id, b.points]).sort()];
      case 'match':
        return [
          ...head,
          q.pairs.map((p) => [p.id, p.points]),
          [...q.pairs.map((p) => p.bId), ...ids(q.distractors)].sort(),
        ];
      case 'order':
        return [...head, q.points, ids(q.tiles).sort()];
      case 'write':
        return [...head, q.points];
      case 'reading':
        return [...head, q.subs.map(shape)];
    }
  };
  return JSON.stringify(content.questions.map(shape));
}

/** AC-18.4: the answers of the parts that still exist (removed or re-kinded parts dropped). */
export function keptAnswers(content: ExerciseSetContent, answers: Answers): Answers {
  const sub = (q: Question | SubQuestion, a: Answer): Answer | null => {
    switch (q.type) {
      case 'mcq':
      case 'vocab': {
        const now = new Set(q.options.map((o) => o.id));
        const optionIds = (a.optionIds ?? []).filter((id) => now.has(id));
        return optionIds.length ? { optionIds } : null;
      }
      case 'cloze': {
        const now = new Set(q.blanks.map((b) => b.id));
        const blanks = Object.fromEntries(
          Object.entries(a.blanks ?? {}).filter(([id]) => now.has(id)),
        );
        return Object.keys(blanks).length ? { blanks } : null;
      }
      case 'match': {
        const items = new Set([...q.pairs.map((p) => p.bId), ...q.distractors.map((d) => d.id)]);
        const pairIds = new Set(q.pairs.map((p) => p.id));
        const pairs = Object.fromEntries(
          Object.entries(a.pairs ?? {}).filter(([p, b]) => pairIds.has(p) && items.has(b)),
        );
        return Object.keys(pairs).length ? { pairs } : null;
      }
      case 'order': {
        const now = new Set(q.tiles.map((t) => t.id));
        const tiles = (a.tiles ?? []).filter((id) => now.has(id));
        return tiles.length ? { tiles } : null;
      }
      case 'write':
        return a.text ? { text: a.text } : null;
      case 'reading': {
        const subs = Object.fromEntries(
          q.subs.flatMap((s) => {
            const kept = a.subs?.[s.id] && sub(s, a.subs[s.id] as Answer);
            return kept ? [[s.id, kept]] : [];
          }),
        );
        return Object.keys(subs).length ? { subs } : null;
      }
    }
  };
  return Object.fromEntries(
    content.questions.flatMap((q) => {
      const a = answers[q.id];
      const kept = a && sub(q, a);
      return kept ? [[q.id, kept]] : [];
    }),
  );
}

/* ---------- learner view: never the key nor the explanation (AC-16.5, NFR-9) ---------- */

const viewOption = z.object({ id: z.string(), text: z.string(), image: fileRefSchema.nullable() });
const viewStem = {
  id: z.string(),
  prompt: z.string(),
  image: fileRefSchema.nullable(),
  points: z.number(),
};
const learnMcq = z.object({
  ...viewStem,
  type: z.literal('mcq'),
  multi: z.boolean(),
  options: z.array(viewOption),
});
const learnCloze = z.object({
  ...viewStem,
  type: z.literal('cloze'),
  segments: z.array(
    z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('text'), text: z.string() }),
      z.object({ kind: z.literal('blank'), id: z.string(), n: z.number() }),
    ]),
  ),
});
export const learnQuestionSchema = z.discriminatedUnion('type', [
  learnMcq,
  z.object({
    ...viewStem,
    type: z.literal('vocab'),
    variant: z.enum(VOCAB_VARIANTS),
    word: z.string(),
    wordPinyin: z.string(),
    meaning: z.string(),
    options: z.array(viewOption),
  }),
  learnCloze,
  z.object({
    ...viewStem,
    type: z.literal('match'),
    headA: z.string(),
    headB: z.string(),
    a: z.array(z.object({ id: z.string(), text: z.string() })),
    b: z.array(z.object({ id: z.string(), text: z.string() })),
  }),
  z.object({
    ...viewStem,
    type: z.literal('order'),
    tiles: z.array(z.object({ id: z.string(), text: z.string() })),
  }),
  z.object({ ...viewStem, type: z.literal('write'), pinyin: z.string(), hint: z.string() }),
  z.object({
    ...viewStem,
    type: z.literal('reading'),
    passage: z.string(),
    passagePinyin: z.string(),
    subs: z.array(z.discriminatedUnion('type', [learnMcq, learnCloze])),
  }),
]);
export type LearnQuestion = z.infer<typeof learnQuestionSchema>;

const viewOptions = (q: McqQuestion | VocabQuestion, pinyin: boolean) =>
  q.options.map((o) => ({
    id: o.id,
    text: pinyin ? pinyinNumbersToMarks(o.text) : o.text,
    image: o.image,
  }));

/** A question as the HV sees it: pinyin with tone marks (AC-7.5), the attempt's shuffles applied. */
export function learnQuestion(q: Question | SubQuestion, shuffles: Shuffles = {}): LearnQuestion {
  const base = { id: q.id, prompt: q.prompt, image: q.image, points: questionPoints(q) };
  switch (q.type) {
    case 'mcq':
      return { ...base, type: 'mcq', multi: q.multi, options: viewOptions(q, false) };
    case 'vocab':
      return {
        ...base,
        type: 'vocab',
        variant: q.variant,
        word: q.word,
        wordPinyin: pinyinNumbersToMarks(q.wordPinyin),
        meaning: q.meaning,
        options: viewOptions(q, q.variant === 'pinyin'),
      };
    case 'cloze':
      return { ...base, type: 'cloze', segments: clozeSegments(q.text) };
    case 'match': {
      const items = new Map<string, string>([
        ...q.pairs.map((p) => [p.bId, p.b] as const),
        ...q.distractors.map((d) => [d.id, d.text] as const),
      ]);
      const order = reconcileOrder(shuffles[q.id], [...items.keys()]);
      return {
        ...base,
        type: 'match',
        headA: q.headA,
        headB: q.headB,
        a: q.pairs.map((p) => ({ id: p.id, text: p.a })),
        b: order.map((id) => ({ id, text: items.get(id) ?? '' })),
      };
    }
    case 'order': {
      const order = reconcileOrder(
        shuffles[q.id],
        q.tiles.map((t) => t.id),
      );
      return {
        ...base,
        type: 'order',
        tiles: tilesByIds(q, order).map((t) => ({ id: t.id, text: t.text })),
      };
    }
    case 'write':
      return { ...base, type: 'write', pinyin: pinyinNumbersToMarks(q.pinyin), hint: q.hint };
    case 'reading':
      return {
        ...base,
        type: 'reading',
        passage: q.passage,
        passagePinyin: pinyinNumbersToMarks(q.passagePinyin),
        subs: q.subs.map(
          (s) => learnQuestion(s) as z.infer<typeof learnMcq> | z.infer<typeof learnCloze>,
        ),
      };
  }
}

/** AC-14.3 on the learner view (S05 board, submit confirmation): the same rule as `answerState`, without the key. */
export function learnAnswerState(q: LearnQuestion, a: Answer | undefined): AnswerState {
  if (!a) return 'none';
  switch (q.type) {
    case 'mcq':
    case 'vocab':
      return q.options.some((o) => a.optionIds?.includes(o.id)) ? 'complete' : 'none';
    case 'cloze': {
      const ids = q.segments.flatMap((s) => (s.kind === 'blank' ? [s.id] : []));
      return stateOf(ids.filter((id) => filled(a.blanks?.[id])).length, ids.length);
    }
    case 'match': {
      const bIds = new Set(q.b.map((b) => b.id));
      return stateOf(q.a.filter((x) => bIds.has(a.pairs?.[x.id] ?? '')).length, q.a.length);
    }
    case 'order': {
      const ids = new Set(q.tiles.map((t) => t.id));
      return stateOf(new Set((a.tiles ?? []).filter((id) => ids.has(id))).size, q.tiles.length);
    }
    case 'write':
      return filled(a.text) ? 'complete' : 'none';
    case 'reading': {
      const states = q.subs.map((s) => learnAnswerState(s, a.subs?.[s.id]));
      if (states.length && states.every((s) => s === 'complete')) return 'complete';
      return states.some((s) => s !== 'none') ? 'partial' : 'none';
    }
  }
}

/* ---------- review rows: S06 and T14 (AC-16.2, AC-16.4, AC-18.3, AC-20.2) ---------- */

export interface ReviewRow {
  /** "3" or "3.2". */
  n: string;
  kind: QuestionKind;
  prompt: string;
  image: FileRef | null;
  earned: number;
  max: number;
  verdict: Verdict;
  /** "Bạn trả lời:" — current text of what was chosen; "—" when nothing. */
  answer: string;
  /** "Đáp án đúng:". */
  key: string;
  explanation: string;
  subs: ReviewRow[];
}
export const reviewRowSchema: z.ZodType<ReviewRow> = z.lazy(() =>
  z.object({
    n: z.string(),
    kind: z.enum(QUESTION_KINDS),
    prompt: z.string(),
    image: fileRefSchema.nullable(),
    earned: z.number(),
    max: z.number(),
    verdict: z.enum(VERDICTS),
    answer: z.string(),
    key: z.string(),
    explanation: z.string(),
    subs: z.array(reviewRowSchema),
  }),
);

const NONE = '—';
const orNone = (parts: readonly string[]) => (parts.length ? parts.join('; ') : NONE);
const optionText = (q: McqQuestion | VocabQuestion, o: Option) => {
  const label = optionLabel(q.options.indexOf(o));
  const text = q.type === 'vocab' && q.variant === 'pinyin' ? pinyinNumbersToMarks(o.text) : o.text;
  return text.trim() ? `${label}. ${text.trim()}` : label;
};

function answerAndKey(
  q: Question | SubQuestion,
  a: Answer | undefined,
): { answer: string; key: string } {
  switch (q.type) {
    case 'mcq':
    case 'vocab':
      return {
        answer: orNone(
          q.options.filter((o) => a?.optionIds?.includes(o.id)).map((o) => optionText(q, o)),
        ),
        key: orNone(q.options.filter((o) => o.correct).map((o) => optionText(q, o))),
      };
    case 'cloze': {
      const blanks = clozeBlanks(q);
      const typed = blanks.map((b, k) => `(${k + 1}) ${a?.blanks?.[b.id]?.trim() || NONE}`);
      const keys = blanks.map(
        (b, k) => `(${k + 1}) ${b.answers.filter((x) => !blank(x)).join(' / ')}`,
      );
      return {
        answer: blanks.some((b) => filled(a?.blanks?.[b.id])) ? typed.join('; ') : NONE,
        key: orNone(keys),
      };
    }
    case 'match': {
      const bText = new Map<string, string>([
        ...q.pairs.map((p) => [p.bId, p.b] as const),
        ...q.distractors.map((d) => [d.id, d.text] as const),
      ]);
      const chosen = q.pairs.flatMap((p) => {
        const id = a?.pairs?.[p.id];
        return id && bText.has(id) ? [`${p.a} → ${bText.get(id)}`] : [];
      });
      return { answer: orNone(chosen), key: orNone(q.pairs.map((p) => `${p.a} → ${p.b}`)) };
    }
    case 'order': {
      const placed = tilesByIds(q, a?.tiles ?? []);
      const accepted = [q.tiles, ...q.alternatives.map((ids) => tilesByIds(q, ids))].map(joinTiles);
      return { answer: placed.length ? joinTiles(placed) : NONE, key: accepted.join(' / ') };
    }
    case 'write':
      return {
        answer: filled(a?.text) ? (a?.text ?? '').trim() : NONE,
        key: orNone([q.answers.filter((x) => !blank(x)).join(' / ')].filter(Boolean)),
      };
    case 'reading':
      return { answer: '', key: '' };
  }
}

function reviewRow(
  q: Question | SubQuestion,
  a: Answer | undefined,
  r: GradeResult,
  n: string,
): ReviewRow {
  const subs =
    q.type === 'reading'
      ? q.subs.map((s, m) => {
          const sr = r.parts?.find((p) => p.id === s.id) ?? gradeQuestion(s, a?.subs?.[s.id]);
          return reviewRow(s, a?.subs?.[s.id], sr, `${n}.${m + 1}`);
        })
      : [];
  return {
    n,
    kind: questionKind(q),
    prompt: q.prompt,
    image: q.image,
    earned: r.earned,
    max: r.max,
    verdict: r.verdict,
    ...answerAndKey(q, a),
    explanation: q.explanation.trim(),
    subs,
  };
}

/** One row per question with the current text of options, items and tiles (AC-18.3). */
export function reviewRows(
  content: ExerciseSetContent,
  answers: Answers,
  results: readonly GradeResult[],
): ReviewRow[] {
  return content.questions.map((q, i) => {
    const r = results.find((x) => x.id === q.id) ?? gradeQuestion(q, answers[q.id]);
    return reviewRow(q, answers[q.id], r, String(i + 1));
  });
}
