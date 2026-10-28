import { describe, expect, it } from 'vitest';
import {
  type Answers,
  type ClozeQuestion,
  type ExerciseSetContent,
  type MatchQuestion,
  type McqQuestion,
  type OrderQuestion,
  type Question,
  type ReadingQuestion,
  type VocabQuestion,
  type WriteQuestion,
  answerState,
  clozeBlanks,
  clozeSegments,
  exerciseSetContentSchema,
  firstInvalidSetProblem,
  gradeQuestion,
  gradeSet,
  keptAnswers,
  markAi,
  screenGeneratedQuestions,
  learnAnswerState,
  learnQuestion,
  makeShuffles,
  markBlank,
  matchesAccepted,
  matchesHanzi,
  newQuestion,
  newSetContent,
  normalizeAnswer,
  onlyHanzi,
  pinyinNumbersToMarks,
  pinyinProblem,
  questionPoints,
  QUESTION_KINDS,
  reconcileOrder,
  reviewRows,
  scorePercent,
  setFileIds,
  setIssues,
  setPoints,
  setStructure,
  unmarkBlank,
  validPoints,
} from './exercises.js';

const opt = (id: string, text: string, correct = false) => ({ id, text, image: null, correct });
const stem = (id: string, prompt = 'Đề') => ({
  id,
  prompt,
  image: null,
  explanation: '',
  ai: false,
});

const mcq = (over: Partial<McqQuestion> = {}): McqQuestion => ({
  ...stem('q1'),
  type: 'mcq',
  multi: false,
  options: [opt('a', '你好', true), opt('b', '再见'), opt('c', '谢谢')],
  points: 2,
  ...over,
});
const cloze = (): ClozeQuestion => ({
  ...stem('q2'),
  type: 'cloze',
  text: '我[[b1]]越南人，他[[b2]]中国人。',
  blanks: [
    { id: 'b1', answers: ['是'], points: 1 },
    { id: 'b2', answers: ['是', '也是'], points: 1.5 },
  ],
});
const match = (): MatchQuestion => ({
  ...stem('q3'),
  type: 'match',
  headA: 'Cột A',
  headB: 'Cột B',
  pairs: [
    { id: 'p1', a: '你好', b: 'Xin chào', bId: 'b1', points: 1 },
    { id: 'p2', a: '谢谢', b: 'Cảm ơn', bId: 'b2', points: 1 },
    { id: 'p3', a: '再见', b: 'Tạm biệt', bId: 'b3', points: 2 },
  ],
  distractors: [{ id: 'd1', text: 'Xin lỗi' }],
});
const order = (): OrderQuestion => ({
  ...stem('q4'),
  type: 'order',
  tiles: [
    { id: 't1', text: '我' },
    { id: 't2', text: '是' },
    { id: 't3', text: '越南' },
    { id: 't4', text: '人' },
  ],
  alternatives: [],
  points: 1,
});
const write = (): WriteQuestion => ({
  ...stem('q5'),
  type: 'write',
  pinyin: 'ni3 hao3',
  hint: 'Xin chào',
  answers: ['你好'],
  points: 1,
});
const reading = (): ReadingQuestion => ({
  ...stem('q6'),
  type: 'reading',
  passage: '我是越南人。',
  passagePinyin: 'Wo3 shi4 Yue4nan2 ren2.',
  subs: [mcq({ id: 's1', points: 1 }), { ...cloze(), id: 's2' }],
});
const vocab = (over: Partial<VocabQuestion> = {}): VocabQuestion => ({
  ...stem('q7', 'Chọn nghĩa đúng của từ'),
  type: 'vocab',
  variant: 'meaning',
  word: '你好',
  wordPinyin: 'nǐ hǎo',
  meaning: '',
  options: [opt('v1', 'Xin chào', true), opt('v2', 'Tạm biệt')],
  points: 1,
  ...over,
});
const setOf = (...questions: Question[]): ExerciseSetContent => ({
  instructions: '',
  stepId: null,
  questions,
});

describe('pinyin validator (AC-7.4)', () => {
  it.each([
    'nǐ hǎo',
    'ni3 hao3',
    'nǐhǎo',
    'Běijīng',
    'xiè xie',
    'lǜ',
    'lv4',
    'nü3',
    "Xī'ān",
    'yīdiǎnr',
    'na3r',
    'zhōngguó',
    'ma5',
    'nǐ hǎo!',
    'Wǒ shì Yuènán rén.',
    'er4',
    'ping2an1',
    "píng'ān",
  ])('accepts %s', (v) => expect(pinyinProblem(v)).toBeNull());

  it.each([
    ['hǎu', 'hǎu'],
    ['ni3 hǎo3', 'hǎo3'],
    ['nǐǐ', 'nǐǐ'],
    ['haǒ', 'haǒ'],
    ['ni6', 'ni6'],
    ['nǐ 好', '好'],
    ['xyz', 'xyz'],
    ['nǐ3', 'nǐ3'],
    ['3ge', '3ge'],
    ['tiānānmén', 'tiānānmén'],
  ])('rejects %s (%s)', (v, bad) => expect(pinyinProblem(v)).toBe(bad));

  it('turns tone numbers into marks, keeping spaces and other digits (AC-7.2, AC-7.5)', () => {
    expect(pinyinNumbersToMarks('ni3 hao3')).toBe('nǐ hǎo');
    expect(pinyinNumbersToMarks('lv4')).toBe('lǜ');
    expect(pinyinNumbersToMarks('ma5')).toBe('ma');
    expect(pinyinNumbersToMarks('nihao3')).toBe('nihǎo');
    expect(pinyinNumbersToMarks('Wo3 shi4')).toBe('Wǒ shì');
    expect(pinyinNumbersToMarks('3个')).toBe('3个');
    expect(pinyinNumbersToMarks('xyz3')).toBe('xyz3');
  });
});

describe('answer matching (AC-7.1 – AC-7.3, AC-10.5)', () => {
  it('normalises spaces, width, case and composed marks', () => {
    expect(normalizeAnswer(' Ni  Hao　')).toBe('nihao');
    expect(normalizeAnswer('ＡＢＣ１２３！')).toBe('abc123!');
    expect(normalizeAnswer('ǎ')).toBe('ǎ');
  });
  it('treats tone numbers as marks and v as ü, but tones stay significant', () => {
    expect(matchesAccepted('ni3 hao3', ['nǐhǎo'])).toBe(true);
    expect(matchesAccepted('lv4', ['lǜ'])).toBe(true);
    expect(matchesAccepted('ma5', ['ma'])).toBe(true);
    expect(matchesAccepted('ni hao', ['nǐ hǎo'])).toBe(false);
    expect(matchesAccepted('mà', ['mǎ'])).toBe(false);
  });
  it('compares Hanzi as written and never accepts empty answers', () => {
    expect(matchesAccepted('漢', ['汉'])).toBe(false);
    expect(matchesAccepted('nǐhǎo', ['你好'])).toBe(false);
    expect(matchesAccepted('3个', ['3个'])).toBe(true);
    expect(matchesAccepted('  ', [''])).toBe(false);
  });
  it('drops punctuation for written Hanzi', () => {
    expect(matchesHanzi('你好！', ['你好'])).toBe(true);
    expect(matchesHanzi('你好.', ['你好。'])).toBe(true);
    expect(matchesHanzi('nihao', ['你好'])).toBe(false);
  });
  it('recognises Hanzi-only text (AC-5.3, AC-10.3)', () => {
    expect(onlyHanzi('你好！')).toBe(true);
    expect(onlyHanzi('你好a')).toBe(false);
    expect(onlyHanzi('！')).toBe(false);
  });
});

describe('content schema', () => {
  it('upgrades the interim 002 multiple choice and defaults new fields', () => {
    const c = exerciseSetContentSchema.parse({
      questions: [{ type: 'mcq', prompt: 'Hỏi', options: ['A', 'B'], answer: 1 }],
    });
    expect(c.instructions).toBe('');
    expect(c.stepId).toBeNull();
    const q = c.questions[0] as McqQuestion;
    expect(q.id).toBe('q0');
    expect(q.options.map((o) => [o.id, o.text, o.correct])).toEqual([
      ['q0o0', 'A', false],
      ['q0o1', 'B', true],
    ]);
    expect(q.points).toBe(1);
  });
  it('refuses duplicate part ids', () => {
    const r = exerciseSetContentSchema.safeParse(setOf(mcq(), mcq()));
    expect(r.success).toBe(false);
  });
  it('builds every kind with default points of 1 (AC-2.1) and a sample set (AC-1.1)', () => {
    for (const kind of QUESTION_KINDS) {
      const q = newQuestion(kind);
      expect(exerciseSetContentSchema.safeParse(setOf(q)).success).toBe(true);
    }
    const s = newSetContent();
    expect(s.questions).toHaveLength(1);
    expect(s.questions[0]?.type).toBe('mcq');
  });
  it('lists the images in use once (AC-3.5)', () => {
    const img = {
      id: 'a'.repeat(24),
      name: 'x.png',
      size: 1,
      contentType: 'image/png',
      pages: null,
    };
    const q = mcq({ image: img, options: [{ ...opt('a', ''), image: img }, opt('b', 'B')] });
    expect(setFileIds(setOf(q))).toEqual([img.id]);
  });
});

describe('cloze blanks (AC-6.1)', () => {
  it('marks and unmarks a blank', () => {
    const q = { ...cloze(), text: '我是越南人', blanks: [] };
    const marked = markBlank(q, 1, 2);
    expect(clozeBlanks(marked)).toHaveLength(1);
    expect(clozeBlanks(marked)[0]?.answers).toEqual(['是']);
    expect(clozeSegments(marked.text).map((s) => s.kind)).toEqual(['text', 'blank', 'text']);
    const id = clozeBlanks(marked)[0]?.id ?? '';
    expect(unmarkBlank(marked, id).text).toBe('我是越南人');
  });
});

describe('field and completeness rules (AC-2.4, AC-2.6, AC-2.7, AC-12.3, AC-12.5)', () => {
  it('checks points', () => {
    expect([0.5, 1, 99.5, 100].every(validPoints)).toBe(true);
    expect([0, 0.25, 100.5, 1.3, Number.NaN].some(validPoints)).toBe(false);
  });
  it('blocks saving on invalid fields only, missing content only blocks publishing', () => {
    const fresh = newSetContent();
    expect(firstInvalidSetProblem('Bộ 1', fresh)).toBeNull();
    expect(firstInvalidSetProblem('', fresh)?.message).toBe('Tiêu đề bắt buộc, tối đa 150 ký tự');
    expect(firstInvalidSetProblem('x'.repeat(151), fresh)?.message).toBe(
      'Tiêu đề bắt buộc, tối đa 150 ký tự',
    );
    expect(firstInvalidSetProblem('Bộ', setOf(mcq({ points: 0.3 })))?.message).toBe(
      'Điểm phải từ 0,5 đến 100 và theo bước 0,5',
    );
    expect(firstInvalidSetProblem('Bộ', setOf({ ...write(), pinyin: 'hǎu' }))?.message).toBe(
      'Pinyin đề không hợp lệ: hǎu',
    );
  });
  it('lists multiple-choice issues', () => {
    expect(setIssues('Bộ', setOf(mcq()))).toEqual([]);
    const bad = mcq({
      prompt: ' ',
      options: [opt('a', 'Một', true), opt('b', ' một '), opt('c', ''), opt('d', 'x', true)],
    });
    expect(setIssues('Bộ', setOf(bad))).toEqual([
      'Câu 1: Câu hỏi cần có đề bài (chữ hoặc hình ảnh)',
      'Câu 1: Phương án B trùng với phương án A',
      'Câu 1: Phương án C đang trống',
      'Câu 1: Hãy chọn đúng 1 đáp án đúng',
    ]);
    expect(
      setIssues('Bộ', setOf(mcq({ multi: true, options: [opt('a', 'A'), opt('b', 'B')] }))),
    ).toEqual(['Câu 1: Hãy chọn ít nhất 1 đáp án đúng']);
    expect(setIssues('Bộ', setOf(mcq({ options: [opt('a', 'A', true)] })))).toEqual([
      'Câu 1: Câu trắc nghiệm cần từ 2 đến 6 phương án',
    ]);
    expect(setIssues('Bộ', setOf())).toEqual(['Bộ bài tập cần ít nhất 1 câu hỏi để xuất bản']);
  });
  it('lists vocabulary issues (AC-5.2 – AC-5.4)', () => {
    expect(setIssues('Bộ', setOf(vocab()))).toEqual([]);
    expect(setIssues('Bộ', setOf(vocab({ word: '' })))).toEqual(['Câu 1: Hãy nhập Từ (chữ Hán)']);
    expect(setIssues('Bộ', setOf(vocab({ word: 'ni' })))).toEqual([
      'Câu 1: Từ chỉ được chứa chữ Hán',
    ]);
    expect(setIssues('Bộ', setOf(vocab({ wordPinyin: 'hǎu' })))).toEqual([
      'Câu 1: Pinyin không hợp lệ: hǎu (Pinyin của từ)',
    ]);
    const hanzi = vocab({ variant: 'hanzi', word: '', wordPinyin: '', meaning: '' });
    expect(setIssues('Bộ', setOf(hanzi))[0]).toBe('Câu 1: Hãy nhập Pinyin hoặc Nghĩa của từ');
    expect(setIssues('Bộ', setOf({ ...hanzi, meaning: 'Xin chào' }))).toEqual([
      'Câu 1: Phương án A chỉ được chứa chữ Hán',
      'Câu 1: Phương án B chỉ được chứa chữ Hán',
    ]);
    const py = vocab({ variant: 'pinyin', options: [opt('a', 'ni3 hao3', true), opt('b', 'hǎu')] });
    expect(setIssues('Bộ', setOf(py))).toEqual(['Câu 1: Pinyin không hợp lệ: hǎu (Phương án B)']);
  });
  it('lists cloze, matching, ordering, writing and reading issues', () => {
    expect(setIssues('Bộ', setOf(cloze(), match(), order(), write(), reading()))).toEqual([]);
    expect(setIssues('Bộ', setOf({ ...cloze(), text: 'Không có chỗ trống' }))).toEqual([
      'Câu 1: Đoạn văn cần từ 1 đến 20 chỗ trống và không quá 3000 ký tự',
    ]);
    const m = match();
    m.pairs[1] = { ...m.pairs[1]!, a: '你好', b: '' };
    m.distractors = [{ id: 'd1', text: ' ' }];
    expect(setIssues('Bộ', setOf(m))).toEqual([
      'Câu 1: Cặp 2: mục Cột B đang trống',
      'Câu 1: Mục nhiễu 1 đang trống',
      'Câu 1: Cột A có mục trùng nhau: 你好',
    ]);
    expect(setIssues('Bộ', setOf({ ...match(), pairs: match().pairs.slice(0, 1) }))).toEqual([
      'Câu 1: Câu nối cặp cần từ 2 đến 8 cặp',
    ]);
    const o = { ...order(), alternatives: [['t1', 't2', 't3', 't4']] };
    expect(setIssues('Bộ', setOf(o))).toEqual([
      'Câu 1: Thứ tự chấp nhận 1 trùng với câu đúng hoặc một thứ tự khác',
    ]);
    expect(
      setIssues('Bộ', setOf({ ...order(), tiles: [{ id: 't1', text: 'x'.repeat(21) }] })),
    ).toEqual(['Câu 1: Câu sắp xếp cần từ 2 đến 12 mảnh, mỗi mảnh 1–20 ký tự']);
    expect(setIssues('Bộ', setOf({ ...write(), pinyin: '', answers: ['ni hao'] }))).toEqual([
      'Câu 1: Hãy nhập Pinyin đề',
      'Câu 1: Đáp án 1 chỉ được chứa chữ Hán',
    ]);
    const r = reading();
    r.subs[0] = mcq({ id: 's1', options: [opt('a', 'A'), opt('b', 'B')] });
    expect(setIssues('Bộ', setOf(r))).toEqual(['Câu 1.1: Hãy chọn đúng 1 đáp án đúng']);
    expect(setIssues('Bộ', setOf({ ...reading(), passage: '' }))).toEqual([
      'Câu 1: Câu đọc hiểu cần đoạn đọc và ít nhất 1 câu hỏi con',
    ]);
  });
  it('sums points (AC-2.3)', () => {
    expect(questionPoints(cloze())).toBe(2.5);
    expect(questionPoints(match())).toBe(4);
    expect(questionPoints(reading())).toBe(3.5);
    expect(setPoints(setOf(mcq(), cloze(), match()))).toBe(8.5);
  });
});

describe('answered state (AC-14.3)', () => {
  it('tells none, partial and complete apart', () => {
    expect(answerState(mcq(), { optionIds: ['b'] })).toBe('complete');
    expect(answerState(mcq(), { optionIds: ['gone'] })).toBe('none');
    expect(answerState(cloze(), { blanks: { b1: '是' } })).toBe('partial');
    expect(answerState(cloze(), { blanks: { b1: '是', b2: ' x ' } })).toBe('complete');
    expect(answerState(match(), { pairs: { p1: 'b2', p2: 'd1', p3: 'b1' } })).toBe('complete');
    expect(answerState(order(), { tiles: ['t1', 't2'] })).toBe('partial');
    expect(answerState(write(), { text: '  ' })).toBe('none');
    expect(answerState(reading(), { subs: { s1: { optionIds: ['a'] } } })).toBe('partial');
  });
});

describe('answered state on the learner view (AC-14.3, S05 board)', () => {
  it('matches the content rule for every kind', () => {
    const cases: [Question, Answers[string] | undefined][] = [
      [mcq(), { optionIds: ['b'] }],
      [cloze(), { blanks: { b1: '是' } }],
      [match(), { pairs: { p1: 'b2', p2: 'd1', p3: 'b1' } }],
      [order(), { tiles: ['t1', 't2'] }],
      [write(), { text: '  ' }],
      [reading(), { subs: { s1: { optionIds: ['a'] } } }],
      [reading(), undefined],
    ];
    for (const [q, a] of cases)
      expect(learnAnswerState(learnQuestion(q), a)).toBe(answerState(q, a));
  });
});

describe('grading (AC-4.7, AC-4.8, AC-6.5, AC-8.7, AC-9.7, AC-10.5, AC-11.5, AC-16.3)', () => {
  it('grades multiple choice all or nothing', () => {
    expect(gradeQuestion(mcq(), { optionIds: ['a'] })).toMatchObject({
      earned: 2,
      verdict: 'correct',
    });
    expect(gradeQuestion(mcq(), { optionIds: ['b'] })).toMatchObject({
      earned: 0,
      verdict: 'wrong',
    });
    expect(gradeQuestion(mcq(), undefined)).toMatchObject({ earned: 0, verdict: 'unanswered' });
    const multi = mcq({
      multi: true,
      options: [opt('a', 'A', true), opt('b', 'B', true), opt('c', 'C')],
    });
    expect(gradeQuestion(multi, { optionIds: ['a', 'b'] }).earned).toBe(2);
    expect(gradeQuestion(multi, { optionIds: ['a'] }).earned).toBe(0);
    expect(gradeQuestion(multi, { optionIds: ['a', 'b', 'c'] }).earned).toBe(0);
  });
  it('grades cloze per blank', () => {
    const r = gradeQuestion(cloze(), { blanks: { b1: ' 是 ', b2: '不是' } });
    expect(r).toMatchObject({ earned: 1, max: 2.5, verdict: 'partial' });
    expect(r.parts?.map((p) => p.verdict)).toEqual(['correct', 'wrong']);
    expect(gradeQuestion(cloze(), { blanks: { b2: '也是' } }).parts?.map((p) => p.verdict)).toEqual(
      ['unanswered', 'correct'],
    );
  });
  it('grades matching per pair; distractors and unmatched earn nothing', () => {
    const r = gradeQuestion(match(), { pairs: { p1: 'b1', p2: 'd1' } });
    expect(r).toMatchObject({ earned: 1, max: 4, verdict: 'partial' });
    expect(r.parts?.map((p) => p.verdict)).toEqual(['correct', 'wrong', 'unanswered']);
  });
  it('grades ordering with interchangeable equal tiles and accepted orders', () => {
    const q: OrderQuestion = {
      ...order(),
      tiles: [
        { id: 't1', text: '我' },
        { id: 't2', text: '的' },
        { id: 't3', text: '书' },
        { id: 't4', text: '的' },
      ],
    };
    expect(gradeQuestion(q, { tiles: ['t1', 't4', 't3', 't2'] }).earned).toBe(1);
    expect(gradeQuestion(q, { tiles: ['t1', 't2', 't3'] })).toMatchObject({
      earned: 0,
      verdict: 'wrong',
    });
    const alt = { ...order(), alternatives: [['t3', 't4', 't1', 't2']] };
    expect(gradeQuestion(alt, { tiles: ['t3', 't4', 't1', 't2'] }).earned).toBe(1);
  });
  it('grades written Hanzi without punctuation, never pinyin or homophones', () => {
    expect(gradeQuestion(write(), { text: '你好！' }).earned).toBe(1);
    expect(gradeQuestion(write(), { text: 'nǐ hǎo' }).earned).toBe(0);
    expect(gradeQuestion({ ...write(), answers: ['他'] }, { text: '她' }).earned).toBe(0);
  });
  it('grades reading per sub-question and a whole set', () => {
    const a: Answers = { q6: { subs: { s1: { optionIds: ['a'] }, s2: { blanks: { b1: 'x' } } } } };
    expect(gradeQuestion(reading(), a.q6)).toMatchObject({
      earned: 1,
      max: 3.5,
      verdict: 'partial',
    });
    const g = gradeSet(setOf(mcq(), reading()), { q1: { optionIds: ['a'] }, ...a });
    expect([g.score, g.maxScore]).toEqual([3, 5.5]);
  });
  it('rounds percentages half up (AC-16.2)', () => {
    expect(scorePercent(6, 10)).toBe(60);
    expect(scorePercent(1, 8)).toBe(13);
    expect(scorePercent(2, 3)).toBe(67);
    expect(scorePercent(0, 0)).toBe(0);
  });
});

describe('shuffles and learner view (AC-8.4, AC-9.4, AC-16.5)', () => {
  const seq = (...xs: number[]) => {
    let i = 0;
    return () => xs[i++ % xs.length] ?? 0;
  };
  it('never shows Cột B in pair order nor the bank as an accepted sentence', () => {
    const content = setOf(match(), order());
    for (const rnd of [seq(0.99), seq(0), Math.random]) {
      const s = makeShuffles(content, rnd);
      expect(s.q3).not.toEqual(['b1', 'b2', 'b3', 'd1']);
      expect(s.q3?.slice().sort()).toEqual(['b1', 'b2', 'b3', 'd1']);
      expect(s.q4).not.toEqual(['t1', 't2', 't3', 't4']);
    }
  });
  it('keeps stored orders and appends new ids (AC-18.4)', () => {
    expect(reconcileOrder(['c', 'x', 'a'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
  });
  it('sends neither keys nor explanations, pinyin with tone marks', () => {
    const q = { ...write(), explanation: 'BÍ MẬT' };
    const v = learnQuestion(q);
    expect(v).toMatchObject({ type: 'write', pinyin: 'nǐ hǎo' });
    const all = [mcq(), cloze(), match(), order(), q, reading(), vocab()].map((x) =>
      JSON.stringify(learnQuestion(x, { q3: ['b3', 'd1', 'b1', 'b2'] })),
    );
    for (const json of all) {
      expect(json).not.toMatch(/correct|answers|explanation|BÍ MẬT|bId|alternatives/);
    }
    const m = learnQuestion(match(), { q3: ['b3', 'd1', 'b1', 'b2'] });
    expect(m.type === 'match' && m.b.map((b) => b.id)).toEqual(['b3', 'd1', 'b1', 'b2']);
  });
});

describe('review rows (AC-16.2, AC-16.4, AC-18.3)', () => {
  it('shows answers and keys with the current text', () => {
    const content = setOf(mcq({ explanation: ' Vì vậy ' }), cloze(), match(), order(), write());
    const answers: Answers = {
      q1: { optionIds: ['b'] },
      q2: { blanks: { b1: '是' } },
      q3: { pairs: { p1: 'b1', p2: 'd1' } },
      q4: { tiles: ['t3', 't2', 't1', 't4'] },
    };
    const rows = reviewRows(content, answers, gradeSet(content, answers).results);
    expect(rows.map((r) => [r.n, r.kind, r.verdict, r.answer, r.key])).toEqual([
      ['1', 'mcq', 'wrong', 'B. 再见', 'A. 你好'],
      ['2', 'cloze', 'partial', '(1) 是; (2) —', '(1) 是; (2) 是 / 也是'],
      [
        '3',
        'match',
        'partial',
        '你好 → Xin chào; 谢谢 → Xin lỗi',
        '你好 → Xin chào; 谢谢 → Cảm ơn; 再见 → Tạm biệt',
      ],
      ['4', 'order', 'wrong', '越南是我人', '我是越南人'],
      ['5', 'write', 'unanswered', '—', '你好'],
    ]);
    expect(rows[0]?.explanation).toBe('Vì vậy');
    // AC-16.3: each blank and each pair has its own result.
    expect(rows[1]?.parts.map((p) => [p.label, p.verdict])).toEqual([
      ['Chỗ trống 1', 'correct'],
      ['Chỗ trống 2', 'unanswered'],
    ]);
    expect(rows[2]?.parts.map((p) => [p.label, p.verdict])).toEqual([
      ['Cặp 1 · 你好', 'correct'],
      ['Cặp 2 · 谢谢', 'wrong'],
      ['Cặp 3 · 再见', 'unanswered'],
    ]);
    expect(rows[0]?.parts).toEqual([]);
    const r = reviewRows(setOf(reading()), {}, [])[0];
    expect(r?.subs.map((s) => s.n)).toEqual(['1.1', '1.2']);
  });
});

describe('structure lock and kept answers (AC-18.1, AC-18.4)', () => {
  const base = () => setOf(mcq(), cloze(), match(), order(), write(), reading(), vocab());
  const edit = (f: (c: ExerciseSetContent) => void) => {
    const c = structuredClone(base());
    f(c);
    return c;
  };
  const q = <T extends Question>(c: ExerciseSetContent, i: number) => c.questions[i] as T;

  it('keeps the structure when text, images, explanations or the key change', () => {
    const changed = edit((c) => {
      c.instructions = 'Mới';
      q<McqQuestion>(c, 0).prompt = 'Đề mới';
      q<McqQuestion>(c, 0).options.forEach((o) => (o.correct = o.id === 'b'));
      q<ClozeQuestion>(c, 1).blanks[0]!.answers = ['不是'];
      const m = q<MatchQuestion>(c, 2);
      [m.pairs[0]!.bId, m.pairs[1]!.bId] = [m.pairs[1]!.bId, m.pairs[0]!.bId];
      q<OrderQuestion>(c, 3).tiles[0]!.text = '你';
      q<OrderQuestion>(c, 3).alternatives = [['t3', 't1', 't2', 't4']];
      q<WriteQuestion>(c, 4).answers = ['您好'];
      q<WriteQuestion>(c, 4).explanation = 'Giải thích';
    });
    expect(setStructure(changed)).toBe(setStructure(base()));
  });

  it.each([
    ['a question added', (c: ExerciseSetContent) => c.questions.push(write())],
    ['questions reordered', (c: ExerciseSetContent) => c.questions.reverse()],
    ['a mode change', (c: ExerciseSetContent) => (q<McqQuestion>(c, 0).multi = true)],
    ['an option removed', (c: ExerciseSetContent) => q<McqQuestion>(c, 0).options.pop()],
    ['points of a question', (c: ExerciseSetContent) => (q<McqQuestion>(c, 0).points = 3)],
    [
      'points of a blank',
      (c: ExerciseSetContent) => (q<ClozeQuestion>(c, 1).blanks[0]!.points = 2),
    ],
    ['a distractor removed', (c: ExerciseSetContent) => (q<MatchQuestion>(c, 2).distractors = [])],
    [
      'a tile added',
      (c: ExerciseSetContent) => q<OrderQuestion>(c, 3).tiles.push({ id: 't5', text: '的' }),
    ],
    ['a sub-question removed', (c: ExerciseSetContent) => q<ReadingQuestion>(c, 5).subs.pop()],
    ['a vocabulary variant', (c: ExerciseSetContent) => (q<VocabQuestion>(c, 6).variant = 'hanzi')],
  ])('changes the structure on %s', (_, f) => {
    expect(setStructure(edit(f))).not.toBe(setStructure(base()));
  });

  it('keeps the answers of the parts that still exist and drops the rest', () => {
    const answers: Answers = {
      q1: { optionIds: ['a', 'c'] },
      q2: { blanks: { b1: '是', b2: '也是' } },
      q3: { pairs: { p1: 'b1', p2: 'd1', p3: 'b3' } },
      q4: { tiles: ['t1', 't2', 't3', 't4'] },
      q5: { text: '你好' },
      q6: { subs: { s1: { optionIds: ['a'] }, s2: { blanks: { b1: '是' } } } },
      gone: { optionIds: ['a'] },
    };
    const changed = edit((c) => {
      q<McqQuestion>(c, 0).options.pop();
      q<ClozeQuestion>(c, 1).blanks.pop();
      q<MatchQuestion>(c, 2).distractors = [];
      q<OrderQuestion>(c, 3).tiles.shift();
      q<ReadingQuestion>(c, 5).subs.pop();
      c.questions[4] = { ...mcq(), id: 'q5' };
    });
    expect(keptAnswers(changed, answers)).toEqual({
      q1: { optionIds: ['a'] },
      q2: { blanks: { b1: '是' } },
      q3: { pairs: { p1: 'b1', p3: 'b3' } },
      q4: { tiles: ['t2', 't3', 't4'] },
      q6: { subs: { s1: { optionIds: ['a'] } } },
    });
  });
});

describe('AI sets (AC-13.1, AC-13.4)', () => {
  it('labels every question and sub-question "AI tạo"', () => {
    const marked = markAi(setOf(mcq(), reading()));
    expect(marked.questions.every((q) => q.ai)).toBe(true);
    const r = marked.questions[1] as ReadingQuestion;
    expect(r.subs.every((s) => s.ai)).toBe(true);
  });

  it('rejects unknown kinds, questions over their limits and questions past 100', () => {
    const tooLong = { ...mcq(), id: 'long', prompt: 'x'.repeat(5000) };
    const out = screenGeneratedQuestions([mcq(), { type: 'listen', id: 'x' }, tooLong, write()]);
    expect(out.accepted.map((q) => q.id)).toEqual(['q1', 'q5']);
    expect(out.rejected).toEqual([
      { index: 1, reason: 'Dạng câu hỏi không được hỗ trợ' },
      { index: 2, reason: 'Vượt giới hạn số lượng hoặc độ dài của dạng câu' },
    ]);
    const many = Array.from({ length: 101 }, (_, i) => ({ ...write(), id: `w${i}` }));
    expect(screenGeneratedQuestions(many).rejected).toEqual([
      { index: 100, reason: 'Bộ bài tập vượt 100 câu hỏi' },
    ]);
  });
});
