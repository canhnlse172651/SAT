import { CLASS_STATUS_LABELS, type ClassStatus, type Progress, progressText } from '@sat/shared';

const TONE: Record<ClassStatus, string> = {
  upcoming: 'chip--info',
  active: 'chip--done',
  ended: 'chip--todo',
};

/** Sắp bắt đầu · Đang học · Đã kết thúc — text, never colour alone (AC-14.1, NFR-6). */
export function ClassStatusChip({ status }: { status: ClassStatus }) {
  return <span className={`chip ${TONE[status]}`}>{CLASS_STATUS_LABELS[status]}</span>;
}

/** "{done}/{total} bộ bài tập" with a bar (009's definition — AC-13.3). */
export function ProgressLine({ progress }: { progress: Progress }) {
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <span className="cls-progress">
      <span
        className="cls-progress__bar"
        role="progressbar"
        aria-label="Tiến độ bài tập"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.done}
      >
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="cls-progress__text">{progressText(progress.done, progress.total)}</span>
    </span>
  );
}
