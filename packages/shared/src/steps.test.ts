import { describe, expect, it } from 'vitest';
import {
  type StepContent,
  badPinyin,
  checkFileChoice,
  convertPinyin,
  firstInvalidMessage,
  formatSize,
  hasHanzi,
  issueLine,
  newStepContent,
  parseYouTubeUrl,
  richTextIsEmpty,
  richTextLength,
  sanitizeRichText,
  stepContentSchema,
  stepIssues,
  stepNotReadyReason,
  stepProblems,
  storagePercent,
  storageUsedLabel,
  storageWarning,
} from './steps.js';

const GB = 1024 ** 3;
const MB = 1024 ** 2;

const ready = (): StepContent =>
  stepContentSchema.parse({
    goal: '',
    blocks: [
      { id: 't', type: 'text', html: '<p>你好</p>' },
      {
        id: 'v',
        type: 'vocab',
        words: [{ hanzi: '你好', pinyin: 'nǐ hǎo', pos: '', meaning: 'xin chào', example: '' }],
      },
      {
        id: 'd',
        type: 'deck',
        name: 'Từ mới',
        cards: [{ id: 'c1', front: '你', pinyin: 'nǐ', meaning: 'bạn', example: '' }],
      },
    ],
  });

describe('stepContentSchema (004 · REQ-3, REQ-4, REQ-11)', () => {
  it('upgrades the interim 002 text block and assigns block ids', () => {
    const c = stepContentSchema.parse({ blocks: [{ type: 'text', text: 'a < b\nc' }] });
    expect(c.goal).toBe('');
    expect(c.blocks[0]).toEqual({ id: 'b0', type: 'text', html: '<p>a &lt; b</p><p>c</p>' });
  });

  it('accepts every block type and defaults optional fields', () => {
    const c = stepContentSchema.parse({
      blocks: [
        { id: 'a', type: 'video', file: null },
        { id: 'b', type: 'dialogue', lines: [{ hanzi: '你好' }] },
        { id: 'c', type: 'grammar', name: 'x', examples: [{ sentence: '吗' }] },
        { id: 'd', type: 'image', file: null, caption: 'Ảnh' },
      ],
    });
    expect(c.blocks[0]).toMatchObject({ youtube: null, caption: '' });
    expect(c.blocks[1]).toMatchObject({ kind: 'dialogue', title: '' });
  });

  it('rejects more than 50 blocks and unknown types', () => {
    const blocks = Array.from({ length: 51 }, (_, i) => ({ id: `b${i}`, type: 'text', html: '' }));
    expect(stepContentSchema.safeParse({ blocks }).success).toBe(false);
    expect(stepContentSchema.safeParse({ blocks: [{ id: 'x', type: 'quiz' }] }).success).toBe(
      false,
    );
  });

  it('a new step has one empty text block', () => {
    const c = newStepContent();
    expect(c.blocks).toHaveLength(1);
    expect(c.blocks[0]?.type).toBe('text');
  });
});

describe('field rules (AC-1.4, AC-4.4, AC-11.4, AC-2.8)', () => {
  it('tells incomplete from invalid fields', () => {
    const c = stepContentSchema.parse({
      blocks: [
        { id: 't', type: 'text', html: '<p> </p>' },
        {
          id: 'v',
          type: 'vocab',
          words: [
            { hanzi: '', meaning: '' },
            { hanzi: 'abc', meaning: 'x', pinyin: 'ni9' },
          ],
        },
      ],
    });
    const problems = stepProblems('', c);
    expect(problems.filter((p) => p.kind === 'incomplete').map((p) => p.message)).toEqual([
      'Vui lòng nhập tên bước học',
      'Khối văn bản chưa có chữ',
      'Vui lòng nhập chữ Hán',
      'Vui lòng nhập nghĩa',
    ]);
    expect(problems.filter((p) => p.kind === 'invalid').map((p) => p.message)).toEqual([
      'Từ phải có chữ Hán',
      'Pinyin không hợp lệ: ni9',
    ]);
    expect(problems.find((p) => p.message === 'Từ phải có chữ Hán')?.path).toBe(
      'blocks.1.words.1.hanzi',
    );
    expect(firstInvalidMessage('', c)).toBe('Từ phải có chữ Hán');
  });

  it('a name over 100 characters is invalid', () => {
    expect(firstInvalidMessage('x'.repeat(101), newStepContent())).toBe(
      'Tên bước học tối đa 100 ký tự',
    );
    expect(firstInvalidMessage('x'.repeat(100), newStepContent())).toBeNull();
  });

  it('checks dialogue lines and cards', () => {
    const c = stepContentSchema.parse({
      blocks: [
        { id: 'd', type: 'dialogue', lines: [{ hanzi: '' }, { hanzi: 'hello' }] },
        { id: 'k', type: 'deck', cards: [{ id: '1', front: 'hi', meaning: '' }] },
      ],
    });
    const messages = stepProblems('Bước', c).map((p) => p.message);
    expect(messages).toEqual([
      'Vui lòng nhập lời thoại',
      'Lời thoại phải có chữ Hán',
      'Mặt trước phải có chữ Hán',
      'Vui lòng nhập nghĩa',
    ]);
  });
});

describe('publish issues (AC-7.1, AC-7.2)', () => {
  it('a complete step is ready', () => {
    expect(stepIssues('Từ mới', ready())).toEqual([]);
    expect(stepNotReadyReason('Từ mới', ready())).toBeNull();
  });

  it('lists issues per block in order', () => {
    const c = stepContentSchema.parse({
      blocks: [
        { id: 't', type: 'text', html: '<p>ok</p>' },
        { id: 'v', type: 'vocab', words: [{ hanzi: '你' }, { hanzi: '好' }] },
        { id: 'x', type: 'video', file: null },
        { id: 'g', type: 'grammar', name: 'Mẫu', examples: [] },
        { id: 'l', type: 'dialogue', lines: [] },
        { id: 'k', type: 'deck', cards: [] },
      ],
    });
    const issues = stepIssues('', c);
    expect(issues.map((i) => issueLine(2, i))).toEqual([
      'Bước 2 · chưa có tên bước học',
      'Bước 2 · Khối 2 · Từ vựng: 2 từ chưa hợp lệ',
      'Bước 2 · Khối 3 · Video: chưa có tệp',
      'Bước 2 · Khối 4 · Ngữ pháp / mẫu câu: chưa có ví dụ',
      'Bước 2 · Khối 5 · Hội thoại / Bài khóa: chưa có dòng nào',
      'Bước 2 · Khối 6 · Bộ thẻ từ vựng: chưa có thẻ nào',
    ]);
    expect(stepNotReadyReason('', c)).toBe('chưa có tên bước học');
  });

  it('a YouTube video counts as content; an empty step has no block', () => {
    const c = stepContentSchema.parse({
      blocks: [{ id: 'x', type: 'video', file: null, youtube: 'dQw4w9WgXcQ' }],
    });
    expect(stepIssues('V', c)).toEqual([]);
    expect(stepNotReadyReason('V', { goal: '', blocks: [] })).toBe('chưa có khối nào');
  });
});

describe('sanitizeRichText (AC-3.5, AC-3.7, NFR-6)', () => {
  it('keeps allowed formats and drops everything else', () => {
    expect(
      sanitizeRichText(
        '<div><b>Đậm</b> <strong>x</strong><table><tr><td>ô</td></tr></table><img src=x onerror=alert(1)></div>',
      ),
    ).toBe('<p><b>Đậm</b> <b>x</b>ô</p>');
    expect(sanitizeRichText('<script>alert(1)</script><p onclick="x()">a</p>')).toBe('<p>a</p>');
    expect(sanitizeRichText('<h1>T</h1><h2>U</h2><ul><li>1</li></ul><ol><li>2</li></ol>')).toBe(
      '<h3>T</h3><h4>U</h4><ul><li>1</li></ul><ol><li>2</li></ol>',
    );
  });

  it('keeps http(s) links and palette colours only', () => {
    expect(sanitizeRichText('<a href="https://hsk.vn/a?b=1&amp;c=2">x</a>')).toBe(
      '<a href="https://hsk.vn/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe('x');
    expect(sanitizeRichText('<span style="color: #DC2626">r</span>')).toBe(
      '<span style="color:#dc2626">r</span>',
    );
    expect(sanitizeRichText('<font color="#dc2626">r</font>')).toBe(
      '<span style="color:#dc2626">r</span>',
    );
    expect(sanitizeRichText('<span style="color: rgb(220, 38, 38)">r</span>')).toBe(
      '<span style="color:#dc2626">r</span>',
    );
    expect(sanitizeRichText('<span style="color:#123456;background:red">r</span>')).toBe('r');
  });

  it('turns styled spans (editor, pasted documents) into bold, italic, underline and palette colours', () => {
    expect(sanitizeRichText('<span style="font-weight: bold;">Đậm</span>')).toBe('<b>Đậm</b>');
    expect(sanitizeRichText('<span style="font-weight:700">x</span>')).toBe('<b>x</b>');
    expect(sanitizeRichText('<span style="font-weight:400">x</span>')).toBe('x');
    expect(sanitizeRichText('<span style="font-style: italic;">n</span>')).toBe('<i>n</i>');
    expect(sanitizeRichText('<span style="text-decoration: underline;">g</span>')).toBe('<u>g</u>');
    expect(sanitizeRichText('<span style="text-decoration-line: underline">g</span>')).toBe(
      '<u>g</u>',
    );
    expect(
      sanitizeRichText(
        '<p>a<span style="font-weight: bold; color: rgb(220, 38, 38);">đỏ</span>b</p>',
      ),
    ).toBe('<p>a<b><span style="color:#dc2626">đỏ</span></b>b</p>');
    expect(
      sanitizeRichText('<span style="font-size:20px;font-style:italic;color:#123456">x</span>'),
    ).toBe('<i>x</i>');
  });

  it('escapes text and closes open tags', () => {
    expect(sanitizeRichText('<b>a "&lt;x&gt;" 你好 nǐ hǎo')).toBe(
      '<b>a "&lt;x&gt;" 你好 nǐ hǎo</b>',
    );
    expect(sanitizeRichText('a</b><br>b')).toBe('a<br>b');
  });

  it('measures the text', () => {
    expect(richTextLength('<p><b>你好</b>&amp;</p>')).toBe(3);
    expect(richTextIsEmpty('<p>&nbsp; <br></p>')).toBe(true);
  });
});

describe('pinyin and Hanzi (AC-4.5)', () => {
  it('converts tone numbers and keeps marks', () => {
    expect(convertPinyin('ni3 hao3')).toBe('nǐ hǎo');
    expect(convertPinyin('lv4')).toBe('lǜ');
    expect(convertPinyin('ma5')).toBe('ma');
    expect(convertPinyin('nǐ hao3')).toBe('nǐ hǎo');
  });

  it('finds a syllable that still has a number', () => {
    expect(badPinyin('nǐ hǎo')).toBeNull();
    expect(badPinyin('ni9 hǎo')).toBe('ni9');
    expect(badPinyin('')).toBeNull();
  });

  it('detects Hanzi', () => {
    expect(hasHanzi('你好 nǐ')).toBe(true);
    expect(hasHanzi('nǐ hǎo')).toBe(false);
  });
});

describe('files and storage (AC-5.1 – AC-5.7)', () => {
  it('checks format and size per block kind', () => {
    expect(checkFileChoice('video', 'a.avi', MB)).toBe(
      'Định dạng không được hỗ trợ. Khối Video chỉ nhận: MP4, MOV, WebM.',
    );
    expect(checkFileChoice('image', 'ảnh 茶.png', 11 * MB)).toBe(
      'Tệp ảnh 茶.png (11 MB) vượt quá giới hạn 10 MB của khối Hình ảnh.',
    );
    expect(checkFileChoice('document', 'Bai.PDF', 50 * MB)).toBeNull();
    expect(checkFileChoice('cardImage', 'a.png', 6 * MB)).toBe(
      'Tệp a.png (6 MB) vượt quá giới hạn 5 MB của khối Hình ảnh.',
    );
  });

  it('formats sizes and the storage meter', () => {
    expect(formatSize(612.4 * MB)).toBe('612,4 MB');
    expect(formatSize(1.5 * GB)).toBe('1,5 GB');
    expect(formatSize(300 * 1024)).toBe('300 KB');
    expect(storageUsedLabel(3.29 * GB)).toBe('Đã dùng 3,2 GB / 10 GB');
    expect(storageUsedLabel(0)).toBe('Đã dùng 0 GB / 10 GB');
    expect(storagePercent(8.59 * GB)).toBe(85);
    expect(storageWarning(7.99 * GB)).toBeNull();
    expect(storageWarning(8 * GB)).toBe('Workspace đã dùng 80% dung lượng lưu trữ.');
  });
});

describe('parseYouTubeUrl (AC-18.2)', () => {
  it('accepts watch, youtu.be and shorts links', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeUrl('youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('refuses other sites and malformed ids', () => {
    expect(parseYouTubeUrl('https://vimeo.com/1')).toBeNull();
    expect(parseYouTubeUrl('https://youtube.com/watch?v=short')).toBeNull();
    expect(parseYouTubeUrl('https://evil.com/youtu.be/dQw4w9WgXcQ')).toBeNull();
  });
});
