import {
  EXERCISE_LEARN_MESSAGES as LM,
  QUESTION_KIND_SHORT,
  type ReviewRow,
  VERDICT_LABELS,
  formatPoints,
  formatVnDate,
  formatVnTime,
  regradeNote,
  vnDayStart,
} from '@sat/shared';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ErrorState, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { myClassPath, myLessonPath } from '../classes/paths';
import { isNotFound, isNotStarted, useHvRefusal } from '../classes/use-hv-refusal';
import { useExerciseStore } from './exercise-store';
import '../classes/classes.css';
import './question-view.css';

const VERDICT_TONE = {
  correct: 'chip--done',
  partial: 'chip--pending',
  wrong: 'chip--danger',
  unanswered: 'chip--todo',
} as const;

/** One question of S06 / T14: kind (S06) or question text (T14), result, answer, key, explanation (AC-16.2, AC-16.4). */
export function ReviewRowView({
  row,
  withPrompt = false,
}: {
  row: ReviewRow;
  withPrompt?: boolean;
}) {
  return (
    <li className="ex-review__row">
      <p className="ex-review__head">
        <strong>
          Câu {row.n} · {QUESTION_KIND_SHORT[row.kind]}
        </strong>
        <span className={`chip ${VERDICT_TONE[row.verdict]}`}>{VERDICT_LABELS[row.verdict]}</span>
        <span className="small">
          {formatPoints(row.earned)} / {formatPoints(row.max)} điểm
        </span>
      </p>
      {withPrompt && row.prompt.trim() && (
        <p className="qv-prompt" lang="zh-Hans">
          {row.prompt}
        </p>
      )}
      {row.kind !== 'reading' && (
        <>
          <p>
            <span className="muted">{withPrompt ? 'Câu trả lời: ' : 'Bạn trả lời: '}</span>
            <span lang="zh-Hans">{row.answer}</span>
          </p>
          {row.parts.length > 0 && (
            <ul className="ex-review__parts" aria-label={`Kết quả từng phần câu ${row.n}`}>
              {row.parts.map((p) => (
                <li key={p.label}>
                  <span lang="zh-Hans">{p.label}</span>:{' '}
                  <span className={`chip ${VERDICT_TONE[p.verdict]}`}>
                    {VERDICT_LABELS[p.verdict]}
                  </span>{' '}
                  <span className="small">
                    {formatPoints(p.earned)} / {formatPoints(p.max)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p>
            <span className="muted">Đáp án đúng: </span>
            <span lang="zh-Hans">{row.key}</span>
          </p>
        </>
      )}
      {row.explanation && (
        <p>
          <span className="muted">Giải thích: </span>
          {row.explanation}
        </p>
      )}
      {row.subs.length > 0 && (
        <ol className="ex-review__rows">
          {row.subs.map((s) => (
            <ReviewRowView key={s.n} row={s} withPrompt={withPrompt} />
          ))}
        </ol>
      )}
    </li>
  );
}

/** S06 "Xem lại bài làm" (REQ-16): only after the one submission, never before (AC-16.5). */
export function ReviewPage() {
  const { classId = '', setId = '' } = useParams();
  const status = useExerciseStore((s) => s.reviewStatus);
  const review = useExerciseStore((s) => s.review);
  const error = useExerciseStore((s) => s.error);
  const load = useExerciseStore((s) => s.loadReview);
  useDocumentTitle('Xem lại bài làm');
  useHvRefusal(error);

  useEffect(() => {
    void load(classId, setId);
  }, [classId, setId, load]);

  const back = { to: myClassPath(classId), label: 'Về trang lớp' };
  if (status === 'error' && isNotFound(error)) return <NotFoundPage back={back} />;
  if (status === 'error' && isNotStarted(error))
    return (
      <div className="hv-pad" data-screen="S06">
        <div className="cls-callout" role="status">
          {error.message}
        </div>
        <Link to={back.to}>{back.label}</Link>
      </div>
    );
  if (status === 'error' && !review) return <ErrorState title="Không tải được bài làm." />;
  if (!review || review.setId !== setId) return <Skeleton height={240} />;

  const lessonLink = (
    <Link
      className="btn btn--outline"
      to={`${myLessonPath(classId, review.lesson.id)}?tab=bai-tap`}
    >
      Về trang bài
    </Link>
  );
  if (!review.submitted)
    return (
      <div className="hv-pad ex-learn" data-screen="S06">
        <h1 className="ex-learn__title">{review.title}</h1>
        <p role="status">{LM.notSubmitted}</p>
        {lessonLink}
      </div>
    );

  return (
    <div className="hv-pad ex-learn" data-screen="S06">
      <h1 className="ex-learn__title">{review.title}</h1>
      <p className="small muted">
        nộp lúc{' '}
        {review.submittedAt
          ? `${formatVnDate(new Date(review.submittedAt))} ${formatVnTime(new Date(review.submittedAt))}`
          : ''}
      </p>
      {review.late && review.deadline && (
        <p className="small">
          <span className="chip chip--pending">Nộp muộn</span> sau hạn 23:59{' '}
          {formatVnDate(vnDayStart(review.deadline))} · {LM.lateNote}
        </p>
      )}
      <p className="ex-review__score">
        {formatPoints(review.score ?? 0)} / {formatPoints(review.maxScore ?? 0)} điểm (
        {review.percent}%)
      </p>
      <p className="small muted">{LM.oneAttempt}</p>
      {review.regrade && (
        <p className="cls-callout" role="note">
          {regradeNote(review.regrade.at, review.regrade.from, review.regrade.to)}
        </p>
      )}
      <h2 className="ex-review__title">Từng câu · đáp án và giải thích</h2>
      <ol className="ex-review__rows">
        {review.rows.map((row) => (
          <ReviewRowView key={row.n} row={row} />
        ))}
      </ol>
      {lessonLink}
    </div>
  );
}
