import { cx } from '../cx';
import './StatusChip.css';

export type StatusKind =
  | 'done'
  | 'todo'
  | 'doing'
  | 'late'
  | 'overdue'
  | 'notOpen'
  | 'draft'
  | 'published'
  | 'archived'
  | 'locked';

const CHIPS: Record<StatusKind, { label: string; tone: string }> = {
  done: { label: 'Đã làm', tone: 'done' },
  todo: { label: 'Chưa làm', tone: 'todo' },
  doing: { label: 'Đang làm', tone: 'info' },
  late: { label: 'Nộp muộn', tone: 'pending' },
  overdue: { label: 'Quá hạn', tone: 'danger' },
  notOpen: { label: 'Chưa mở', tone: 'todo' },
  draft: { label: 'Nháp', tone: 'pending' },
  published: { label: 'Đã xuất bản', tone: 'done' },
  archived: { label: 'Lưu trữ', tone: 'todo' },
  locked: { label: 'Đã khóa', tone: 'danger' },
};

export interface StatusChipProps {
  status: StatusKind;
  className?: string;
}

/** Status is always text + colour, never colour alone. */
export function StatusChip({ status, className }: StatusChipProps) {
  const { label, tone } = CHIPS[status];
  return <span className={cx('chip', `chip--${tone}`, className)}>{label}</span>;
}
