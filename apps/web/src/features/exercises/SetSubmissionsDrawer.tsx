import { formatScore, formatVnDate, formatVnTime } from '@sat/shared';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { Button, Drawer, EmptyState, ErrorState, Skeleton } from '../../components';
import { submissionPath } from '../classes/paths';
import { useExerciseStore } from './exercise-store';

interface Props {
  classId: string;
  set: { id: string; title: string } | null;
  onClose: () => void;
}

/** T04 Nội dung → the submissions of one set in the class → T14 (AC-20.1). */
export function SetSubmissionsDrawer({ classId, set, onClose }: Props) {
  const status = useExerciseStore((s) => s.setSubmissionsStatus);
  const items = useExerciseStore((s) => s.setSubmissions);
  const load = useExerciseStore((s) => s.loadSetSubmissions);
  const setId = set?.id;

  useEffect(() => {
    if (setId) void load(classId, setId);
  }, [classId, setId, load]);

  const body = () => {
    if (status === 'error') return <ErrorState title="Không tải được bài nộp." />;
    if (status !== 'ok') return <Skeleton height={160} />;
    if (!items.length) return <EmptyState title="Chưa có học viên nào nộp bộ bài tập này." />;
    return (
      <table className="tbl">
        <thead>
          <tr>
            <th>Học viên</th>
            <th>Nộp lúc</th>
            <th>Điểm</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const at = new Date(it.submittedAt);
            return (
              <tr key={it.student.id}>
                <td className="strong">{it.student.name}</td>
                <td className="num small">
                  {formatVnDate(at)} {formatVnTime(at)}
                  {it.late && (
                    <>
                      {' '}
                      <span className="chip chip--pending">Nộp muộn</span>
                    </>
                  )}
                </td>
                <td className="num">
                  {formatScore(it.score)} / {formatScore(it.maxScore)} ({it.percent}%)
                </td>
                <td className="r">
                  <Link
                    className="btn btn--outline btn--sm"
                    to={submissionPath(classId, it.student.id, set?.id ?? '')}
                    aria-label={`Xem bài nộp của ${it.student.name}`}
                  >
                    Xem bài nộp
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <Drawer
      open={!!set}
      onClose={onClose}
      title="Bài nộp"
      description={set?.title}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      {set && body()}
    </Drawer>
  );
}
