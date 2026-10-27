import { describe, expect, it } from 'vitest';
import {
  copyName,
  curriculumBodySchema,
  CURRICULUM_MESSAGES as M,
  itemNotReadyReason,
  lessonNameSchema,
  newItemContent,
} from './curriculum.js';

const issues = (r: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => Object.fromEntries((r.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));

describe('curriculum field rules (002 AC-1.3, AC-1.5, AC-5.3)', () => {
  it('normalises the name and accepts a valid body', () => {
    const r = curriculumBodySchema.parse({ name: '  Giáo   trình  ', hsk: 3 });
    expect(r).toEqual({ name: 'Giáo trình', hsk: 3, description: '' });
  });
  it('reports every invalid field with the spec wording', () => {
    const r = curriculumBodySchema.safeParse({ name: '   ', description: 'x'.repeat(2001) });
    expect(issues(r)).toEqual({
      name: M.nameRequired,
      hsk: M.hskRequired,
      description: M.descriptionTooLong,
    });
    expect(issues(curriculumBodySchema.safeParse({ name: 'x'.repeat(101), hsk: 10 }))).toEqual({
      name: M.nameTooLong,
      hsk: M.hskRequired,
    });
  });
  it('checks lesson names', () => {
    expect(lessonNameSchema.safeParse(' ').error?.issues[0]?.message).toBe(M.lessonNameRequired);
    expect(lessonNameSchema.safeParse('x'.repeat(101)).error?.issues[0]?.message).toBe(
      M.lessonNameTooLong,
    );
    expect(lessonNameSchema.parse(' Bài 1 – 你好 ')).toBe('Bài 1 – 你好');
  });
});

describe('copyName (AC-14.1, AC-15.1)', () => {
  it('adds the suffix and keeps 100 characters at most', () => {
    expect(copyName('Bài 2 – 你好')).toBe('Bài 2 – 你好 (bản sao)');
    expect(copyName('HSK1', 3)).toBe('HSK1 (bản sao 3)');
    const long = copyName('a'.repeat(100));
    expect(long).toHaveLength(100);
    expect(long.endsWith(' (bản sao)')).toBe(true);
  });
});

describe('itemNotReadyReason (AC-9.2)', () => {
  it('treats new items as not ready', () => {
    expect(itemNotReadyReason('lesson', '', newItemContent('lesson'))).toBe('chưa có tên bước học');
    expect(itemNotReadyReason('lesson', 'Chào', newItemContent('lesson'))).toBe(
      'Khối 1 · Văn bản: chưa có chữ',
    );
    expect(itemNotReadyReason('exercise', '', newItemContent('exercise'))).toBe(
      'Tiêu đề bắt buộc, tối đa 150 ký tự',
    );
    expect(itemNotReadyReason('exercise', 'Bộ 1', newItemContent('exercise'))).toBe(
      'Câu 1: Câu hỏi cần có đề bài (chữ hoặc hình ảnh)',
    );
    expect(itemNotReadyReason('lesson', 'x', { blocks: [] })).toBe('chưa có khối nào');
  });
  it('checks sets with the 005 rules (legacy multiple choice upgraded)', () => {
    const q = { type: 'mcq', prompt: 'Hỏi', options: ['A', ''], answer: 0 };
    expect(itemNotReadyReason('exercise', 'Bộ 1', { questions: [q] })).toBe(
      'Câu 1: Phương án B đang trống',
    );
    const q2 = { ...q, options: ['A', 'B'], answer: null };
    expect(itemNotReadyReason('exercise', 'Bộ 1', { questions: [q2] })).toBe(
      'Câu 1: Hãy chọn đúng 1 đáp án đúng',
    );
    const ok = { ...q, options: ['A', 'B'], answer: 1 };
    expect(itemNotReadyReason('exercise', ' ', { questions: [ok] })).toBe(
      'Tiêu đề bắt buộc, tối đa 150 ký tự',
    );
    expect(itemNotReadyReason('exercise', 'Bộ 1', { questions: [ok] })).toBeNull();
    expect(itemNotReadyReason('exercise', 'Bộ 1', { questions: [] })).toBe(
      'Bộ bài tập cần ít nhất 1 câu hỏi để xuất bản',
    );
    expect(
      itemNotReadyReason('lesson', 'Chào', { blocks: [{ type: 'text', text: '你好' }] }),
    ).toBeNull();
  });
});
