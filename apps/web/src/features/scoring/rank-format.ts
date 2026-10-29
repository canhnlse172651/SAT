import { formatPoints, formatVnDate, formatVnTime } from '@sat/shared';

/** "18/20 · 90%" — a submission's own points (AC-11.1, AC-11.8). */
export const gotText = (got: number, max: number, points: number) =>
  `${formatPoints(got)}/${formatPoints(max)} · ${points}%`;

/** AC-13.2: "Cập nhật lúc HH:mm · dd/mm/yyyy" (Vietnam time of the server's answer). */
export const updatedText = (iso: string) => {
  const d = new Date(iso);
  return `Cập nhật lúc ${formatVnTime(d)} · ${formatVnDate(d)}`;
};

/** AC-10.1 "Cập nhật lần cuối": dd/mm/yyyy HH:mm, as the prototype T04 tab shows it. */
export const achievedText = (iso: string) => {
  const d = new Date(iso);
  return `${formatVnDate(d)} ${formatVnTime(d)}`;
};

export const SET_STATUS = {
  todo: { label: 'Chưa làm', tone: 'todo' },
  done: { label: 'Đã có điểm', tone: 'done' },
  overdue: { label: 'Quá hạn', tone: 'danger' },
} as const;

export const EXAM_STATUS = {
  todo: { label: 'Chưa thi', tone: 'todo' },
  done: { label: 'Đã có điểm', tone: 'done' },
  noShow: { label: 'Không làm bài', tone: 'danger' },
} as const;
