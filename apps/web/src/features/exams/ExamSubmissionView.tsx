import { EXAM_MESSAGES as M, formatPoints, formatSpent, formatVnStamp } from '@sat/shared';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorState, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { ReviewRowView } from '../exercises/ReviewPage';
import { useExamsStore } from './exams-store';
import '../exercises/question-view.css';

/** T14 for an exam submission (006 AC-15.5): read-only, keys and explanations shown even before the close. */
export function ExamSubmissionView() {
  const [params] = useSearchParams();
  const examId = params.get('thi') ?? '';
  const classId = params.get('lop') ?? '';
  const studentId = params.get('hv') ?? '';
  const sub = useExamsStore((s) => s.submission);
  const status = useExamsStore((s) => s.submissionStatus);
  const error = useExamsStore((s) => s.submissionError);
  const load = useExamsStore((s) => s.loadSubmission);
  useDocumentTitle('Xem bài nộp');

  useEffect(() => {
    void load({ examId, studentId, classId });
  }, [examId, studentId, classId, load]);

  if (status === 'error' && (error?.status === 404 || error?.status === 400))
    return <NotFoundPage />;
  if (status === 'error') return <ErrorState title="Không tải được bài nộp." />;
  if (!sub || sub.exam.id !== examId || sub.student.id !== studentId)
    return <Skeleton height={320} />;

  const started = new Date(sub.startedAt);
  const submitted = new Date(sub.submittedAt);
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
        <dt>Bài thi</dt>
        <dd>{sub.exam.name}</dd>
        <dt>Bắt đầu</dt>
        <dd>{formatVnStamp(started)}</dd>
        <dt>Nộp lúc</dt>
        <dd>
          {formatVnStamp(submitted)}{' '}
          {sub.auto && <span className="chip chip--pending">{M.autoLabel}</span>}
        </dd>
        <dt>Thời gian làm bài</dt>
        <dd>{formatSpent(submitted.getTime() - started.getTime())}</dd>
        <dt>Điểm</dt>
        <dd>
          <strong>{sub.percent}/100</strong> · {formatPoints(sub.score)} /{' '}
          {formatPoints(sub.maxScore)} điểm
        </dd>
      </dl>
      <ol className="ex-review__rows">
        {sub.rows.map((row) => (
          <ReviewRowView key={row.n} row={row} withPrompt />
        ))}
      </ol>
    </section>
  );
}
