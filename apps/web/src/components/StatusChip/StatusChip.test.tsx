import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusChip, type StatusKind } from './StatusChip';

const LABELS: Array<[StatusKind, string]> = [
  ['done', 'Đã làm'],
  ['todo', 'Chưa làm'],
  ['doing', 'Đang làm'],
  ['late', 'Nộp muộn'],
  ['overdue', 'Quá hạn'],
  ['notOpen', 'Chưa mở'],
  ['draft', 'Nháp'],
  ['published', 'Đã xuất bản'],
  ['archived', 'Lưu trữ'],
  ['locked', 'Đã khóa'],
];

describe('StatusChip', () => {
  it.each(LABELS)('shows the text for %s', (status, label) => {
    render(<StatusChip status={status} />);
    expect(screen.getByText(label)).toBeVisible();
  });
});
