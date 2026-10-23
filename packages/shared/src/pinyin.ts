const TONE_MARKS: Record<string, readonly [string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

const PLAIN_BY_MARKED = new Map<string, string>();
for (const [plain, marked] of Object.entries(TONE_MARKS)) {
  for (const m of marked) {
    PLAIN_BY_MARKED.set(m, plain);
    PLAIN_BY_MARKED.set(m.toUpperCase(), plain.toUpperCase());
  }
}

/** Index of the vowel that carries the tone mark: a/e first, 'ou' -> o, otherwise the last vowel. */
function toneIndex(syllable: string): number {
  const lower = syllable.toLowerCase();
  let i = lower.search(/[ae]/);
  if (i >= 0) return i;
  i = lower.indexOf('ou');
  if (i >= 0) return i;
  for (let k = lower.length - 1; k >= 0; k--) {
    if ('iouü'.includes(lower.charAt(k))) return k;
  }
  return -1;
}

function markSyllable(letters: string, tone: number): string {
  const text = letters.replace(/v/g, 'ü').replace(/V/g, 'Ü');
  if (tone < 1 || tone > 4) return text; // 0 / 5 = neutral tone: no mark
  const idx = toneIndex(text);
  if (idx < 0) return text;
  const ch = text.charAt(idx);
  const lower = ch.toLowerCase();
  const marked = TONE_MARKS[lower]?.[tone - 1];
  if (!marked) return text;
  const out = ch === lower ? marked : marked.toUpperCase();
  return text.slice(0, idx) + out + text.slice(idx + 1);
}

/** 'ni3 hao3' -> 'nǐ hǎo'. ü is typed as 'v' or 'u:'; tone 5 or 0 is neutral. */
export function numberedToToneMarks(input: string): string {
  return input
    .replace(/u:/g, 'ü')
    .replace(/U:/g, 'Ü')
    .replace(/([A-Za-zÜü]+)([0-5])/g, (_m, letters: string, tone: string) =>
      markSyllable(letters, Number(tone)),
    );
}

/** Removes tone marks (keeps ü): 'nǐhǎo' -> 'nihao', 'lǜ' -> 'lü'. */
export function stripTones(input: string): string {
  let out = '';
  for (const ch of input.normalize('NFC')) out += PLAIN_BY_MARKED.get(ch) ?? ch;
  return out;
}

/** Search key: lowercase, tones removed, ü/u: -> v, spaces/digits/apostrophes removed. */
export function normalizePinyinQuery(input: string): string {
  return stripTones(input.toLowerCase().replace(/u:/g, 'ü'))
    .replace(/ü/g, 'v')
    .replace(/[\s\d'’]/g, '');
}
