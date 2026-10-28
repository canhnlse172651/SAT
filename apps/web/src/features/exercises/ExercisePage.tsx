import {
  EXERCISE_LEARN_MESSAGES as LM,
  LEARNER_SET_LABELS,
  type ExerciseView,
  learnAnswerState,
  formatScore,
  unfinishedLine,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { Button, ConfirmDialog, ErrorState, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { myClassPath, myLessonPath, setResultPath, stepPath } from '../classes/paths';
import { isNotFound, isNotStarted, useHvRefusal } from '../classes/use-hv-refusal';
import { useExerciseStore } from './exercise-store';
import { QuestionView } from './QuestionView';
import '../classes/classes.css';
import './question-view.css';

const TONE: Record<ExerciseView['set']['status'], string> = {
  done: 'chip--done',
  closed: 'chip--todo',
  overdue: 'chip--danger',
  doing: 'chip--info',
  todo: 'chip--todo',
};

const BOARD_LABEL = {
  complete: 'đã hoàn thành',
  partial: 'trả lời một phần',
  none: 'chưa trả lời',
} as const;

/** S05 "Làm bài tập" (REQ-14, REQ-15, REQ-17, REQ-21, REQ-23). */
export function ExercisePage() {
  const { classId = '', setId = '' } = useParams();
  const navigate = useNavigate();
  const status = useExerciseStore((s) => s.status);
  const view = useExerciseStore((s) => s.view);
  const entered = useExerciseStore((s) => s.entered);
  const error = useExerciseStore((s) => s.error);
  const answers = useExerciseStore((s) => s.answers);
  const index = useExerciseStore((s) => s.index);
  const pending = useExerciseStore((s) => s.pending);
  const saveState = useExerciseStore((s) => s.saveState);
  const refusal = useExerciseStore((s) => s.refusal);
  const submitting = useExerciseStore((s) => s.submitting);
  const submitOffline = useExerciseStore((s) => s.submitOffline);
  const load = useExerciseStore((s) => s.load);
  const start = useExerciseStore((s) => s.start);
  const answer = useExerciseStore((s) => s.answer);
  const go = useExerciseStore((s) => s.go);
  const submit = useExerciseStore((s) => s.submit);
  const [confirming, setConfirming] = useState(false);
  const [nothing, setNothing] = useState(false);
  useDocumentTitle(view?.set.title ?? 'Làm bài tập');
  useHvRefusal(error);

  useEffect(() => {
    void load(classId, setId);
  }, [classId, setId, load]);

  // AC-14.6: unsaved answers warn before leaving.
  const unsaved = pending.length > 0 || saveState === 'offline';
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      unsaved && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!unsaved) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [unsaved]);

  const back = { to: myClassPath(classId), label: 'Về trang lớp' };
  if (status === 'error' && isNotFound(error)) return <NotFoundPage back={back} />;
  if (status === 'error' && isNotStarted(error))
    return (
      <div className="hv-pad" data-screen="S05">
        <div className="cls-callout" role="status">
          {error.message}
        </div>
        <Link to={back.to}>{back.label}</Link>
      </div>
    );
  if (status === 'error' && !view) return <ErrorState title="Không tải được bài tập." />;
  if (!view || view.set.id !== setId) return <Skeleton height={240} />;

  const { set, attempt } = view;
  const reviewLink = (
    <Link className="btn btn--primary" to={setResultPath(classId, setId)}>
      Xem lại bài làm
    </Link>
  );
  const refusalBox = refusal && (
    <div className="cls-callout" role="alert">
      <p>{refusal.message}</p>
      {refusal.code === 'ALREADY_SUBMITTED' && reviewLink}
    </div>
  );

  /* ---------- start screen (AC-14.1, AC-23.3, AC-23.8) ---------- */
  if (!attempt || !entered) {
    const done = set.status === 'done';
    return (
      <div className="hv-pad ex-learn" data-screen="S05">
        <p className="small muted">{view.lesson.name}</p>
        <h1 className="ex-learn__title">{set.title}</h1>
        <p className="hv-row__chips">
          <span className={`chip ${TONE[set.status]}`}>
            {done && set.score !== null && set.maxScore !== null
              ? `${LEARNER_SET_LABELS.done} · ${formatScore(set.score)} / ${formatScore(set.maxScore)}`
              : LEARNER_SET_LABELS[set.status]}
          </span>
          {done && set.late && <span className="chip chip--pending">Nộp muộn</span>}
        </p>
        {set.deadlineLabel && <p className="small">{set.deadlineLabel}</p>}
        {set.status === 'closed' && <p className="small muted">{LM.noDeadline}</p>}
        {set.instructions.trim() && <p className="muted">{set.instructions}</p>}
        {view.practiceFor && (
          <Link to={stepPath(classId, view.practiceFor.id)}>
            Luyện tập cho: {view.practiceFor.title}
          </Link>
        )}
        <dl className="ex-learn__facts">
          <dt>Số câu hỏi</dt>
          <dd>{set.questionCount}</dd>
          <dt>Tổng điểm</dt>
          <dd>{formatScore(set.totalPoints)}</dd>
          <dt>Điểm</dt>
          <dd>
            {done && set.score !== null && set.maxScore !== null
              ? `${formatScore(set.score)} / ${formatScore(set.maxScore)}`
              : '—'}
          </dd>
        </dl>
        <p className="small muted">
          Mỗi bộ bài tập chỉ được nộp một lần; điểm của lần nộp đó là điểm của bộ. Sau khi nộp, bạn
          xem lại bài làm kèm đáp án và giải thích.
        </p>
        {refusalBox}
        {done ? (
          reviewLink
        ) : set.canWork ? (
          <Button onClick={() => void start()}>
            {view.hasAttempt ? 'Tiếp tục làm' : 'Bắt đầu làm'}
          </Button>
        ) : (
          set.status !== 'closed' &&
          set.blockedReason && <p className="muted">{set.blockedReason}</p>
        )}
        <Link to={myLessonPath(classId, view.lesson.id)}>Về trang bài</Link>
      </div>
    );
  }

  /* ---------- the attempt (AC-14.2 … AC-14.9, REQ-15) ---------- */
  const qs = attempt.questions;
  const q = qs[Math.min(index, qs.length - 1)];
  const states = qs.map((x) => learnAnswerState(x, answers[x.id]));
  const unfinished = states.flatMap((s, k) => (s === 'complete' ? [] : [k + 1]));
  const askSubmit = () => {
    if (states.every((s) => s === 'none')) {
      setNothing(true);
      return;
    }
    setNothing(false);
    setConfirming(true);
  };
  const doSubmit = async () => {
    setConfirming(false);
    if (await submit()) navigate(setResultPath(classId, setId));
  };

  return (
    <div className="hv-pad ex-learn" data-screen="S05">
      <p className="small muted">{set.title}</p>
      {attempt.updated && (
        <p className="cls-callout" role="status">
          {LM.updatedByTeacher}
        </p>
      )}
      <nav className="ex-board" aria-label="Bảng câu hỏi">
        {qs.map((x, k) => (
          <button
            key={x.id}
            type="button"
            className={`ex-board__no ex-board__no--${states[k]}${k === index ? ' ex-board__no--now' : ''}`}
            aria-label={`Câu ${k + 1} · ${BOARD_LABEL[states[k] ?? 'none']}`}
            aria-current={k === index ? 'step' : undefined}
            onClick={() => go(k)}
          >
            {k + 1}
          </button>
        ))}
      </nav>
      <p className="ex-learn__count">
        Câu {index + 1}/{qs.length}
      </p>
      {q && (
        <QuestionView
          q={q}
          n={String(index + 1)}
          answer={answers[q.id]}
          onAnswer={(a) => answer(q.id, a)}
        />
      )}
      <div className="ex-learn__nav">
        <Button variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>
          Câu trước
        </Button>
        <Button variant="outline" disabled={index >= qs.length - 1} onClick={() => go(index + 1)}>
          Câu sau
        </Button>
      </div>
      <p className="small muted" role="status" aria-live="polite">
        {saveState === 'saving'
          ? LM.saving
          : saveState === 'saved'
            ? LM.saved
            : saveState === 'offline'
              ? LM.offline
              : ''}
      </p>
      {refusalBox}
      {nothing && (
        <p className="field__error" role="alert">
          {LM.nothingAnswered}
        </p>
      )}
      {submitOffline && (
        <div className="cls-callout" role="alert">
          <p>{LM.submitOffline}</p>
          <Button variant="outline" onClick={() => void doSubmit()}>
            Thử lại
          </Button>
        </div>
      )}
      <Button onClick={askSubmit} disabled={submitting || saveState === 'refused'}>
        Nộp bài
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Nộp bài?"
        message={unfinished.length ? unfinishedLine(unfinished) : LM.allDone}
        confirmLabel="Nộp bài"
        cancelLabel="Làm tiếp"
        onConfirm={() => void doSubmit()}
        onCancel={() => setConfirming(false)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Rời trang?"
        message={LM.leaveWarning}
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
}
