import { type ExamState, examStateAt } from '@sat/shared';

/** AC-3.6: Đã lên lịch / Đang mở / Đã đóng follow the (server) clock on screen too, without a reload. */
export function liveState(
  x: { state: ExamState; opensAt: string | null; closesAt: string | null },
  now: Date,
): ExamState {
  if (x.state === 'draft' || x.state === 'archived') return x.state;
  return examStateAt(
    {
      phase: 'scheduled',
      opensAt: x.opensAt ? new Date(x.opensAt) : null,
      closesAt: x.closesAt ? new Date(x.closesAt) : null,
    },
    now,
  );
}
