import { EXAM_STATE_LABELS, type ExamState } from '@sat/shared';

const TONE: Record<ExamState, string> = {
  draft: 'chip--pending',
  scheduled: 'chip--info',
  open: 'chip--done',
  closed: 'chip--todo',
  archived: 'chip--todo',
};

export function ExamStateChip({ state }: { state: ExamState }) {
  return <span className={`chip ${TONE[state]}`}>{EXAM_STATE_LABELS[state]}</span>;
}
