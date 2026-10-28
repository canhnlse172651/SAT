import {
  EXAM_ERROR_CODES as E,
  EXAM_MESSAGES as M,
  type LearnerExamView,
  formatCountdown,
  formatPoints,
  formatSpent,
  formatVnDateTime,
  formatVnHms,
  learnAnswerState,
  unfinishedLine,
} from '@sat/shared';
import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';
import { Button, ConfirmDialog, ErrorState, Icon, Skeleton } from '../../components';
import { NOT_FOUND_PATH } from '../../lib/home-path';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { QuestionView } from '../exercises/QuestionView';
import { ReviewRowView } from '../exercises/ReviewPage';
import { useToastStore } from '../toast/toast-store';
import { useLearnExamsStore } from './learn-exams-store';
import { Lobby } from './Lobby';
import { RESULT_PARAM, myExamsPath } from './paths';
import { serverNow, useServerNow } from './server-clock';
import '../classes/classes.css';
import '../exercises/question-view.css';
import './exams.css';

const BOARD = {
  complete: 'đã hoàn thành',
  partial: 'trả lời một phần',
  none: 'chưa trả lời',
} as const;
const MIN = 60_000;

/** S08 Làm bài thi (REQ-9 … REQ-12) and its result (REQ-14). */
export function ExamTakePage() {
  const { examId = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // "Xem kết quả" (S07, the time-up notice) goes straight to the result; a bare reopen of an automatic
  // submission first says so (AC-12.3).
  const [seenAuto, setSeenAuto] = useState(params.has(RESULT_PARAM));
  const st = useLearnExamsStore;
  const view = st((s) => s.view);
  const viewStatus = st((s) => s.viewStatus);
  const viewError = st((s) => s.viewError);
  const attempt = st((s) => s.attempt);
  const [ready, setReady] = useState<{ id: string; phase: 'doing' | 'other' } | null>(null);
  const phase = ready?.id === examId ? ready.phase : 'loading';
  const setPhase = (p: 'doing' | 'other') => setReady({ id: examId, phase: p });
  useDocumentTitle(view?.exam.name ?? 'Làm bài thi');

  useEffect(() => {
    let live = true;
    const settle = (p: 'doing' | 'other') => setReady({ id: examId, phase: p });
    void (async () => {
      const v = await st.getState().loadView(examId);
      if (!live || !v) return;
      if (v.attempt?.status === 'doing') {
        const err = await st.getState().open(examId);
        if (!live) return;
        if (!err) {
          settle('doing');
          return;
        }
        await st.getState().loadView(examId, true);
      }
      if (live) settle('other');
    })();
    return () => {
      live = false;
      st.getState().leave();
    };
  }, [examId, st]);

  if (viewStatus === 'error' && viewError?.status === 404) return <NotFoundPage />;
  if (viewStatus === 'error' && !view) return <ErrorState title="Không tải được bài thi." />;
  if (phase === 'loading' || !view || view.exam.id !== examId) return <Skeleton height={320} />;
  if (phase === 'doing' && attempt?.examId === examId)
    return (
      <Attempt
        name={view.exam.name}
        onResult={() => {
          setSeenAuto(true);
          void st
            .getState()
            .loadView(examId, true)
            .then(() => setPhase('other'));
        }}
      />
    );
  const r = view.result;
  if (r?.kind === 'submitted' && r.auto && !seenAuto)
    return (
      <div className="xm-take" data-screen="S08">
        <div className="xm-take__bar">
          <p className="xm-take__name strong">{view.exam.name}</p>
          <span className="xm-timer xm-timer--danger" role="timer" aria-label="Thời gian còn lại">
            <Icon name="clock" size={16} />
            00:00
          </span>
        </div>
        <div className="cls-callout cls-callout--warn xm-take__notice" role="alert">
          <p className="strong">{M.autoSubmitted(new Date(r.submittedAt))}</p>
          <p>Mọi ô trả lời đã khóa.</p>
          <Button onClick={() => setSeenAuto(true)}>Xem kết quả</Button>
        </div>
      </div>
    );
  return (
    <Outcome
      view={view}
      onStarted={() => setPhase('doing')}
      onNotFound={() => navigate(NOT_FOUND_PATH)}
    />
  );
}

/** No attempt in progress: the lobby (open exam), the result (AC-14.1 … AC-14.5), or the current state (AC-8.4). */
function Outcome({
  view,
  onStarted,
  onNotFound,
}: {
  view: LearnerExamView;
  onStarted: () => void;
  onNotFound: () => void;
}) {
  const navigate = useNavigate();
  const start = useLearnExamsStore((s) => s.start);
  const loadView = useLearnExamsStore((s) => s.loadView);
  const push = useToastStore((s) => s.push);
  const [busy, setBusy] = useState(false);
  const r = view.result;

  // AC-14.2 → AC-14.3: the answers appear once the exam is closed and every attempt submitted.
  useEffect(() => {
    if (r?.kind !== 'submitted' || r.revealed) return;
    const t = setInterval(() => void loadView(view.exam.id, true), 30_000);
    return () => clearInterval(t);
  }, [r, view.exam.id, loadView]);

  if (!r && view.canStart)
    return (
      <Lobby
        exam={view.exam}
        busy={busy}
        onBack={() => navigate(myExamsPath)}
        onStart={() => {
          setBusy(true);
          void start(view.exam.id).then((err) => {
            setBusy(false);
            if (!err) return onStarted();
            if (err.status === 404) return onNotFound();
            if (err.code !== E.EXAM_SUBMITTED)
              push(err.status ? err.message : 'Mất kết nối — hãy thử lại.', 'warn');
            navigate(myExamsPath);
          });
        }}
      />
    );
  const back = (
    <Link className="btn btn--primary btn--block" to={myExamsPath}>
      Về danh sách bài thi
    </Link>
  );
  if (!r)
    return (
      <div className="hv-pad xm-result" data-screen="S08">
        <h1 className="ex-learn__title">{view.exam.name}</h1>
        <p role="status">Bài thi không còn mở để bắt đầu.</p>
        {back}
      </div>
    );
  if (r.kind === 'noShow')
    return (
      <div className="hv-pad xm-result" data-screen="S08">
        <p className="small muted">{view.exam.name}</p>
        <p className="xm-score">
          0<small>/100</small>
        </p>
        <p className="strong">{M.noShow}</p>
        {back}
      </div>
    );
  if (r.kind === 'closed')
    return (
      <div className="hv-pad xm-result" data-screen="S08">
        <p className="small muted">{view.exam.name}</p>
        <p className="strong">{M.closedNoResult}</p>
        {back}
      </div>
    );
  const at = new Date(r.submittedAt);
  return (
    <div className="hv-pad xm-result" data-screen="S08">
      <h1 className="ex-learn__title">{view.exam.name}</h1>
      <p className="small">
        Đã nộp lúc {formatVnDateTime(at)}{' '}
        {r.auto && <span className="chip chip--pending">{M.autoLabel}</span>}
      </p>
      <p className="xm-score" aria-label={`${r.percent}/100`}>
        {r.percent}
        <small>/100</small>
      </p>
      <p>
        {formatPoints(r.score)} / {formatPoints(r.maxScore)} điểm
      </p>
      <p className="small muted">
        Thời gian làm bài: {formatSpent(at.getTime() - Date.parse(r.startedAt))}
      </p>
      <p className="small muted">{M.oneAttemptDone}</p>
      {r.revealed ? (
        <>
          <h2 className="ex-review__title">Từng câu · đáp án và giải thích</h2>
          <ol className="ex-review__rows">
            {r.rows.map((row) => (
              <ReviewRowView key={row.n} row={row} />
            ))}
          </ol>
        </>
      ) : (
        <p className="cls-callout" role="note">
          {M.revealLater(new Date(view.exam.closesAt))}
        </p>
      )}
      {back}
    </div>
  );
}

/** The timed attempt (REQ-9 … REQ-12). */
function Attempt({ name, onResult }: { name: string; onResult: () => void }) {
  const now = useServerNow(500);
  const st = useLearnExamsStore;
  const attempt = st((s) => s.attempt);
  const endsAt = st((s) => s.endsAt);
  const answers = st((s) => s.answers);
  const index = st((s) => s.index);
  const pending = st((s) => s.pending);
  const saveState = st((s) => s.saveState);
  const savedAt = st((s) => s.savedAt);
  const held = st((s) => s.held);
  const removed = st((s) => s.removed);
  const autoAt = st((s) => s.autoAt);
  const done = st((s) => s.done);
  const submitting = st((s) => s.submitting);
  const submitOffline = st((s) => s.submitOffline);
  const { answer, go, submit, timeUp, poll, open } = st.getState();
  const push = useToastStore((s) => s.push);
  const [confirming, setConfirming] = useState(false);
  const warned = useRef<{ w5: boolean; w1: boolean } | null>(null);

  const left = endsAt - now.getTime();
  // AC-9.4: each notice once; a mark already passed when the attempt started is skipped.
  if (warned.current === null) {
    const start = endsAt - serverNow().getTime();
    warned.current = { w5: start <= 5 * MIN, w1: start <= MIN };
  }
  useEffect(() => {
    const w = warned.current;
    if (!w || autoAt || done) return;
    if (!w.w5 && left <= 5 * MIN && left > MIN) {
      w.w5 = true;
      push(M.warn5, 'warn');
    }
    if (!w.w1 && left <= MIN && left > 0) {
      w.w1 = w.w5 = true;
      push(M.warn1, 'warn');
    }
    // The confirmation closes by itself (it only shows while time is left).
    if (left <= 0) void timeUp();
  }, [left, autoAt, done, push, timeUp]);

  useEffect(() => {
    const t = setInterval(() => void poll(), 5_000);
    return () => clearInterval(t);
  }, [poll]);
  useEffect(() => {
    if (done) onResult();
  }, [done, onResult]);

  // AC-10.5: unsaved answers warn before leaving.
  const unsaved = pending.length > 0 && !autoAt && !done;
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

  if (!attempt) return <Skeleton height={320} />;
  const qs = attempt.questions;
  const q = qs[Math.min(index, qs.length - 1)];
  const states = qs.map((x) => learnAnswerState(x, answers[x.id]));
  const unfinished = states.flatMap((s, k) => (s === 'complete' ? [] : [k + 1]));
  const frozen = !!autoAt || held || removed;
  const offline = saveState === 'offline';
  const timer = (
    <span
      className={`xm-timer${left <= MIN ? ' xm-timer--danger' : left <= 5 * MIN ? ' xm-timer--warn' : ''}`}
      role="timer"
      aria-label="Thời gian còn lại"
    >
      <Icon name="clock" size={16} />
      {autoAt ? '00:00' : formatCountdown(left)}
    </span>
  );

  return (
    <div className="xm-take" data-screen="S08">
      <div className="xm-take__bar">
        <p className="xm-take__name strong">{name}</p>
        {timer}
      </div>
      {autoAt && (
        <div className="cls-callout cls-callout--warn xm-take__notice" role="alert">
          <p className="strong">{M.autoSubmitted(autoAt)}</p>
          <p>Mọi ô trả lời đã khóa.</p>
          <Button onClick={onResult}>Xem kết quả</Button>
        </div>
      )}
      {!autoAt && offline && (
        <div className="cls-callout cls-callout--warn" role="alert">
          {M.offline} <strong>{M.unsaved(pending.length)}.</strong>
        </div>
      )}
      {!autoAt && held && (
        <div className="cls-callout cls-callout--warn" role="alert">
          {M.heldElsewhere}.{' '}
          <button type="button" className="link" onClick={() => void open(attempt.examId)}>
            Làm bài ở đây
          </button>
        </div>
      )}
      {!autoAt && removed && (
        <div className="cls-callout cls-callout--warn" role="alert">
          {M.removed}
        </div>
      )}
      {submitOffline && !autoAt && (
        <div className="cls-callout cls-callout--warn" role="alert">
          <p>{M.submitOffline}</p>
          <Button variant="outline" onClick={() => void submit()}>
            Thử lại
          </Button>
        </div>
      )}

      <nav className="ex-board" aria-label="Bảng số câu">
        {qs.map((x, k) => (
          <button
            key={x.id}
            type="button"
            className={`ex-board__no ex-board__no--${states[k]}${k === index ? ' ex-board__no--now' : ''}`}
            aria-label={`Câu ${k + 1} · ${BOARD[states[k] ?? 'none']}`}
            aria-current={k === index ? 'step' : undefined}
            onClick={() => go(k)}
          >
            {k + 1}
          </button>
        ))}
      </nav>
      <div className="xm-take__status">
        <span className="small strong">
          Câu {index + 1}/{qs.length}
        </span>
        <span className="small muted" role="status" aria-live="polite">
          {offline
            ? M.unsaved(pending.length)
            : saveState === 'saving'
              ? M.saving
              : savedAt
                ? M.savedAtHms(formatVnHms(savedAt))
                : ''}
        </span>
      </div>
      {q && (
        <div className="xm-question">
          <QuestionView
            q={q}
            n={String(index + 1)}
            answer={answers[q.id]}
            onAnswer={(a) => answer(q.id, a)}
            readOnly={frozen}
          />
        </div>
      )}
      <div className="ex-learn__nav xm-take__nav">
        <Button variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>
          ‹ Câu trước
        </Button>
        {index < qs.length - 1 ? (
          <Button variant="outline" onClick={() => go(index + 1)}>
            Câu sau ›
          </Button>
        ) : null}
        <Button disabled={frozen || submitting} onClick={() => setConfirming(true)}>
          <Icon name="send" size={16} />
          Nộp bài
        </Button>
      </div>

      <ConfirmDialog
        open={confirming && !autoAt && left > 0}
        title="Nộp bài thi?"
        message={
          <>
            <span>{unfinished.length ? unfinishedLine(unfinished) : M.allDone}</span>
            <br />
            <span>{M.noRedo}</span>
          </>
        }
        confirmLabel="Nộp bài"
        cancelLabel="Làm tiếp"
        onConfirm={() => {
          setConfirming(false);
          void submit();
        }}
        onCancel={() => setConfirming(false)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Rời trang?"
        message={M.leaveWarning}
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
}
