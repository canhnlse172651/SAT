import { formatPoints, formatVnDate, formatVnTime, regradeNote, vnDayStart } from '@sat/shared';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorState, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { useExerciseStore } from './exercise-store';
import { ReviewRowView } from './ReviewPage';
import './question-view.css';

const isNotFound = (err: { status: number } | null) => err?.status === 404;

/** T14 "Xem bài nộp" (REQ-20): read-only — nothing to edit, no grading control (AC-20.3). */
export function SubmissionPage() {
  const [params] = useSearchParams();
  const classId = params.get('lop') ?? '';
  const studentId = params.get('hv') ?? '';
  const setId = params.get('bo') ?? '';
  const status = useExerciseStore((s) => s.submissionStatus);
  const sub = useExerciseStore((s) => s.submission);
  const error = useExerciseStore((s) => s.error);
  const load = useExerciseStore((s) => s.loadSubmission);
  useDocumentTitle('Xem bài nộp');

  useEffect(() => {
    void load({ classId, studentId, setId });
  }, [classId, studentId, setId, load]);

  if (status === 'error' && (isNotFound(error) || error?.status === 400)) return <NotFoundPage />;
  if (status === 'error') return <ErrorState title="Không tải được bài nộp." />;
  if (!sub || sub.set.id !== setId || sub.student.id !== studentId)
    return <Skeleton height={320} />;

  const at = new Date(sub.submittedAt);
  return (
    <section className="ex-learn ex-submission" data-screen="T14" aria-labelledby="t14-title">
      <div className="page-head">
        <h1 id="t14-title">Xem bài nộp</h1>
      </div>
      <dl className="ex-learn__facts">
        <dt>Học viên</dt>
        <dd>{sub.student.name}</dd>
        <dt>Lớp</dt>
        <dd>{sub.class.name}</dd>
        <dt>Bài</dt>
        <dd>{sub.lesson.name}</dd>
        <dt>Bộ bài tập</dt>
        <dd>{sub.set.title}</dd>
        <dt>Nộp lúc</dt>
        <dd>
          {formatVnDate(at)} {formatVnTime(at)}
        </dd>
        <dt>Điểm</dt>
        <dd>
          {formatPoints(sub.score)} / {formatPoints(sub.maxScore)} điểm ({sub.percent}%)
        </dd>
      </dl>
      {sub.late && sub.deadline && (
        <p className="small">
          <span className="chip chip--pending">Nộp muộn</span> sau hạn 23:59{' '}
          {formatVnDate(vnDayStart(sub.deadline))}
        </p>
      )}
      {sub.notes.map((n) => (
        <p key={n} className="chip chip--todo" role="note">
          {n}
        </p>
      ))}
      {sub.regrade && (
        <p className="st-notice" role="note">
          {regradeNote(sub.regrade.at, sub.regrade.from, sub.regrade.to)}
        </p>
      )}
      <ol className="ex-review__rows">
        {sub.rows.map((row) => (
          <ReviewRowView key={row.n} row={row} withPrompt />
        ))}
      </ol>
    </section>
  );
}
