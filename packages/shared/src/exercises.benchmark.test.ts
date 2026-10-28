// 005 NFR-4: the reference suite of the grading rules — ≥ 400 grading cases (AC-4.7, AC-4.8, AC-6.5, AC-7.1–AC-7.3, AC-8.7,
// AC-9.7, AC-10.5, AC-11.5) and ≥ 150 pinyin validity cases (AC-7.4). Expected results come from the rules, not from the code.
import { describe, expect, it } from 'vitest';
import {
  type Answer,
  type ClozeQuestion,
  type MatchQuestion,
  type McqQuestion,
  type OrderQuestion,
  type ReadingQuestion,
  type WriteQuestion,
  gradeQuestion,
  pinyinProblem,
} from './exercises.js';

const stem = (id: string) => ({ id, prompt: 'Đề', image: null, explanation: '', ai: false });

/** [tone numbers, tone marks] — written by hand. */
const WORDS: readonly (readonly [string, string])[] = [
  ['ni3 hao3', 'nǐ hǎo'],
  ['xie4 xie5', 'xiè xie'],
  ['zai4 jian4', 'zài jiàn'],
  ['zhong1 guo2', 'zhōng guó'],
  ['bei3 jing1', 'běi jīng'],
  ['yue4 nan2', 'yuè nán'],
  ['lao3 shi1', 'lǎo shī'],
  ['xue2 sheng5', 'xué sheng'],
  ['peng2 you5', 'péng you'],
  ['ma1 ma5', 'mā ma'],
  ['ba4 ba5', 'bà ba'],
  ['ge1 ge5', 'gē ge'],
  ['jie3 jie5', 'jiě jie'],
  ['di4 di5', 'dì di'],
  ['mei4 mei5', 'mèi mei'],
  ['han4 zi4', 'hàn zì'],
  ['pin1 yin1', 'pīn yīn'],
  ['shui3 guo3', 'shuǐ guǒ'],
  ['ka1 fei1', 'kā fēi'],
  ['cha2', 'chá'],
  ['mi3 fan4', 'mǐ fàn'],
  ['jiao4 shi4', 'jiào shì'],
  ['tu2 shu1 guan3', 'tú shū guǎn'],
  ['yi1 yuan4', 'yī yuàn'],
  ['shang1 dian4', 'shāng diàn'],
  ['fei1 ji1', 'fēi jī'],
  ['huo3 che1', 'huǒ chē'],
  ['dian4 nao3', 'diàn nǎo'],
  ['shou3 ji1', 'shǒu jī'],
  ['xi3 huan5', 'xǐ huan'],
  ['gao1 xing4', 'gāo xìng'],
  ['ren4 shi5', 'rèn shi'],
  ['ming2 tian1', 'míng tiān'],
  ['zuo2 tian1', 'zuó tiān'],
  ['jin1 tian1', 'jīn tiān'],
  ['lv4 se4', 'lǜ sè'],
  ['nv3 er2', 'nǚ ér'],
  ['lv3 you2', 'lǚ yóu'],
  ['qu4 nian2', 'qù nián'],
  ['xue3', 'xuě'],
];

const STRIP: Record<string, string> = Object.fromEntries(
  [...'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'].map((c, i) => [c, 'aeiouü'[Math.floor(i / 4)] ?? '']),
);
const toneless = (marked: string) => [...marked].map((c) => STRIP[c] ?? c).join('');
/** Joins syllables, with an apostrophe before a syllable starting with a, o or e (standard pinyin). */
const joined = (s: string) =>
  s
    .split(' ')
    .map((syl, i) => (i > 0 && /^[aoeāáǎàōóǒòēéěè]/.test(syl) ? `'${syl}` : syl))
    .join('');
/** The first syllable with another tone (1→2, 2→3, 3→4, 4→1). */
const otherTone = (numbered: string) =>
  numbered.replace(/^([a-zü]+)([1-4])/, (_, s: string, t: string) => `${s}${(Number(t) % 4) + 1}`);
const upper = (s: string) => s.toUpperCase();
const FW = '　'; // ideographic (full-width) space
const fullWidthSpaces = (s: string) => ` ${s.replaceAll(' ', FW + FW)}${FW}`;

// ---------- grading cases ----------

interface Case {
  name: string;
  grade: () => number;
  expected: number;
}
const cases: Case[] = [];
const add = (name: string, grade: () => number, expected: number) =>
  cases.push({ name, grade, expected });
const earned = (q: Parameters<typeof gradeQuestion>[0], a: Answer | undefined) =>
  gradeQuestion(q, a).earned;

// AC-6.5, AC-7.1 – AC-7.3: a pinyin blank accepts marks or numbers, any case, width or spacing, v for ü; tones matter.
const pinyinBlank = (accepted: string): ClozeQuestion => ({
  ...stem('c'),
  type: 'cloze',
  text: 'Pinyin: [[b]]',
  blanks: [{ id: 'b', answers: [accepted], points: 2 }],
});
for (const [numbered, marked] of WORDS) {
  const q = pinyinBlank(marked);
  const typed = (v: string) => () => earned(q, { blanks: { b: v } });
  add(`${marked} ← "${marked}"`, typed(marked), 2);
  add(`${marked} ← "${numbered}"`, typed(numbered), 2);
  add(`${marked} ← "${upper(marked)}"`, typed(upper(marked)), 2);
  add(`${marked} ← full-width spaces`, typed(fullWidthSpaces(marked)), 2);
  add(`${marked} ← "${joined(marked).replaceAll("'", '')}"`, typed(marked.replaceAll(' ', '')), 2);
  add(`${marked} ← other tone "${otherTone(numbered)}"`, typed(otherTone(numbered)), 0);
  add(`${marked} ← no tones "${toneless(marked)}"`, typed(toneless(marked)), 0);
}

// AC-10.5: written Hanzi as written; punctuation and spaces ignored; never pinyin, traditional forms or homophones.
const HANZI = [
  '你好',
  '谢谢',
  '再见',
  '中国',
  '北京',
  '越南',
  '老师',
  '学生',
  '朋友',
  '妈妈',
  '汉字',
  '水果',
  '咖啡',
  '茶',
  '米饭',
  '医院',
  '商店',
  '飞机',
  '电脑',
  '喜欢',
];
const writeQ = (answers: string[]): WriteQuestion => ({
  ...stem('w'),
  type: 'write',
  pinyin: '',
  hint: '',
  answers,
  points: 1,
});
for (const [i, h] of HANZI.entries()) {
  const q = writeQ([h]);
  const typed = (v: string) => () => earned(q, { text: v });
  add(`write ${h}`, typed(h), 1);
  add(`write ${h}！`, typed(`${h}！`), 1);
  add(`write ${h}。`, typed(`${h}。`), 1);
  add(`write spaced ${h}`, typed([...h].join(' ')), 1);
  add(`write ${h} as pinyin`, typed(WORDS[i]?.[1] ?? 'pinyin'), 0);
  add(`write empty for ${h}`, typed('   '), 0);
}
const TRADITIONAL = [
  ['汉字', '漢字'],
  ['谢谢', '謝謝'],
  ['学生', '學生'],
  ['电脑', '電腦'],
  ['中国', '中國'],
  ['再见', '再見'],
  ['飞机', '飛機'],
  ['医院', '醫院'],
  ['东西', '東西'],
  ['书', '書'],
] as const;
for (const [simple, other] of TRADITIONAL)
  add(`write ${other} for ${simple}`, () => earned(writeQ([simple]), { text: other }), 0);
const HOMOPHONES = [
  ['他', '她'],
  ['在', '再'],
  ['做', '作'],
  ['的', '得'],
  ['是', '事'],
  ['四', '十'],
  ['买', '卖'],
  ['已', '己'],
  ['那', '哪'],
  ['他们', '她们'],
] as const;
for (const [right, other] of HOMOPHONES)
  add(`write ${other} for ${right}`, () => earned(writeQ([right]), { text: other }), 0);
add('write: second accepted answer', () => earned(writeQ(['你好', '您好']), { text: '您好' }), 1);

// AC-4.7: one correct option — all points or nothing; AC-4.8: several correct — exactly the correct set.
const mcqQ = (n: number, correct: readonly number[], multi: boolean): McqQuestion => ({
  ...stem('m'),
  type: 'mcq',
  multi,
  options: Array.from({ length: n }, (_, i) => ({
    id: `o${i}`,
    text: `Phương án ${i}`,
    image: null,
    correct: correct.includes(i),
  })),
  points: 3,
});
for (let n = 2; n <= 6; n++)
  for (let k = 0; k < n; k++) {
    const q = mcqQ(n, [k], false);
    for (let pick = 0; pick < n; pick++)
      add(
        `single ${n} options, key ${k}, pick ${pick}`,
        () => earned(q, { optionIds: [`o${pick}`] }),
        pick === k ? 3 : 0,
      );
  }
for (let n = 3; n <= 6; n++) {
  const q = mcqQ(n, [0, 2], true);
  const pick =
    (...ids: number[]) =>
    () =>
      earned(q, { optionIds: ids.map((i) => `o${i}`) });
  add(`multi ${n}: exact`, pick(2, 0), 3);
  add(`multi ${n}: subset`, pick(0), 0);
  add(`multi ${n}: superset`, pick(0, 1, 2), 0);
  add(`multi ${n}: disjoint`, pick(1), 0);
  add(`multi ${n}: nothing`, pick(), 0);
}

// AC-8.7: per pair; a distractor or a wrong item earns nothing for that pair.
const matchQ: MatchQuestion = {
  ...stem('p'),
  type: 'match',
  headA: 'Cột A',
  headB: 'Cột B',
  pairs: [
    { id: 'p1', a: '你好', b: 'Xin chào', bId: 'b1', points: 1 },
    { id: 'p2', a: '谢谢', b: 'Cảm ơn', bId: 'b2', points: 2 },
    { id: 'p3', a: '再见', b: 'Tạm biệt', bId: 'b3', points: 3 },
    { id: 'p4', a: '对不起', b: 'Xin lỗi', bId: 'b4', points: 4 },
  ],
  distractors: [
    { id: 'd1', text: 'Chúc mừng' },
    { id: 'd2', text: 'Không sao' },
  ],
};
const perms = (xs: string[]): string[][] =>
  xs.length <= 1
    ? [xs]
    : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
for (const p of perms(['b1', 'b2', 'b3', 'b4'])) {
  const expected = p.reduce((s, b, i) => s + (b === `b${i + 1}` ? i + 1 : 0), 0);
  add(
    `match ${p.join(',')}`,
    () => earned(matchQ, { pairs: { p1: p[0]!, p2: p[1]!, p3: p[2]!, p4: p[3]! } }),
    expected,
  );
}
for (const d of ['d1', 'd2'])
  for (let i = 1; i <= 4; i++) {
    const pairs: Record<string, string> = { p1: 'b1', p2: 'b2', p3: 'b3', p4: 'b4', [`p${i}`]: d };
    add(`match distractor ${d} on p${i}`, () => earned(matchQ, { pairs }), 10 - i);
  }
add('match nothing', () => earned(matchQ, { pairs: {} }), 0);
add('match one pair', () => earned(matchQ, { pairs: { p3: 'b3' } }), 3);

// AC-9.7: the whole sentence or nothing; tiles with the same text are interchangeable; accepted alternatives.
const orderQ: OrderQuestion = {
  ...stem('o'),
  type: 'order',
  tiles: [
    { id: 't1', text: '我' },
    { id: 't2', text: '是' },
    { id: 't3', text: '老师' },
    { id: 't4', text: '，' },
    { id: 't5', text: '我' },
    { id: 't6', text: '是' },
    { id: 't7', text: '越南人' },
  ],
  alternatives: [['t5', 't6', 't7', 't4', 't1', 't2', 't3']],
  points: 2,
};
const placed =
  (...ids: string[]) =>
  () =>
    earned(orderQ, { tiles: ids });
add('order: key', placed('t1', 't2', 't3', 't4', 't5', 't6', 't7'), 2);
add('order: equal tiles swapped', placed('t5', 't6', 't3', 't4', 't1', 't2', 't7'), 2);
add('order: equal 我 swapped only', placed('t5', 't2', 't3', 't4', 't1', 't6', 't7'), 2);
add('order: equal 是 swapped only', placed('t1', 't6', 't3', 't4', 't5', 't2', 't7'), 2);
add('order: accepted alternative', placed('t5', 't6', 't7', 't4', 't1', 't2', 't3'), 2);
add(
  'order: alternative with equal tiles swapped',
  placed('t1', 't2', 't7', 't4', 't5', 't6', 't3'),
  2,
);
add('order: two tiles wrong', placed('t2', 't1', 't3', 't4', 't5', 't6', 't7'), 0);
add('order: missing tile', placed('t1', 't2', 't3', 't4', 't5', 't6'), 0);
add('order: reversed', placed('t7', 't6', 't5', 't4', 't3', 't2', 't1'), 0);
add('order: empty', placed(), 0);

// AC-11.5: a reading question earns the sum of its sub-questions.
const readingQ: ReadingQuestion = {
  ...stem('r'),
  type: 'reading',
  passage: '我是越南人。',
  passagePinyin: '',
  subs: [
    { ...mcqQ(3, [1], false), id: 's1' },
    { ...pinyinBlank('nǐ hǎo'), id: 's2' },
  ],
};
const sub = (mcqPick: string | null, blank: string | null) => () =>
  earned(readingQ, {
    subs: {
      ...(mcqPick ? { s1: { optionIds: [mcqPick] } } : {}),
      ...(blank !== null ? { s2: { blanks: { b: blank } } } : {}),
    },
  });
add('reading: both right', sub('o1', 'ni3 hao3'), 5);
add('reading: mcq only', sub('o1', 'ni hao'), 3);
add('reading: blank only', sub('o0', 'nǐhǎo'), 2);
add('reading: both wrong', sub('o2', 'nǐ hào'), 0);
add('reading: nothing', sub(null, null), 0);

describe('[005:NFR-4] reference grading suite', () => {
  it('has at least 400 grading cases', () => expect(cases.length).toBeGreaterThanOrEqual(400));
  it.each(cases.map((c) => [c.name, c] as const))('%s', (_, c) => {
    expect(c.grade()).toBe(c.expected);
  });
});

// ---------- pinyin validity (AC-7.4) ----------

const valid = WORDS.flatMap(([numbered, marked]) => [
  numbered,
  marked,
  joined(marked),
  joined(numbered),
  marked.charAt(0).toUpperCase() + marked.slice(1),
]);
const invalid = WORDS.flatMap(([numbered, marked]) => [
  marked.includes(' ') ? marked.replace(' ', '3 ') : `${marked}3`, // a tone mark and a tone number on one syllable
  numbered.replace(/[1-5]/, '6'), // no tone 6
  `${marked} 好`, // Hanzi in a pinyin field
]).concat(['hǎu', 'xyz', 'nǐǐ', 'haǒ', 'bv', 'qa', 'ngi', 'zhv', 'tiānānmén', '3ge']);

describe('[005:NFR-4] reference pinyin suite (AC-7.4)', () => {
  it('has at least 150 pinyin cases', () =>
    expect(valid.length + invalid.length).toBeGreaterThanOrEqual(150));
  it.each(valid)('accepts %s', (v) => expect(pinyinProblem(v)).toBeNull());
  it.each(invalid)('rejects %s', (v) => expect(pinyinProblem(v)).not.toBeNull());
});
