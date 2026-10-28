import {
  EXAM_ERROR_CODES as E,
  EXAM_MESSAGES as M,
  type LearnerExam,
  type LearnerExamView,
  formatHms,
  learnerRowLine,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, ErrorState, Icon, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NOT_FOUND_PATH } from '../../lib/home-path';
import { useToastStore } from '../toast/toast-store';
import { useLearnExamsStore } from './learn-exams-store';
import { Lobby } from './Lobby';
import { myExamPath, myExamResultPath } from './paths';
import { serverNow, useServerNow } from './server-clock';
import '../classes/classes.css';
import '../exercises/question-view.css';
import './exams.css';

const DAY = 24 * 3_600_000;
const TONE: Record<LearnerExam['row']['kind'], string> = {
  submitted: 'done',
  doing: 'pending',
  noShow: 'danger',
  closed: 'todo',
  notOpen: 'todo',
  ended: 'todo',
  open: 'info',
};

/** The next moment a row changes state on its own (open, close, end of an attempt) — AC-7.6. */
function nextBoundary(items: readonly LearnerExam[], now: number): number | null {
  const times = items.flatMap((x) =>
    [x.opensAt, x.closesAt, x.row.endsAt].flatMap((t) => (t ? [Date.parse(t)] : [])),
  );
  const future = times.filter((t) => t > now);
  return future.length ? Math.min(...future) : null;
}

/** S07 Bài thi (REQ-7) with the lobby (REQ-8). */
export function MyExamsPage() {
  useDocumentTitle('Bài thi');
  const navigate = useNavigate();
  const now = useServerNow(1000);
  const list = useLearnExamsStore((s) => s.list);
  const status = useLearnExamsStore((s) => s.listStatus);
  const loadList = useLearnExamsStore((s) => s.loadList);
  const loadView = useLearnExamsStore((s) => s.loadView);
  const start = useLearnExamsStore((s) => s.start);
  const push = useToastStore((s) => s.push);
  const [lobby, setLobby] = useState<LearnerExamView | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadList();
    const timer = setInterval(() => void loadList(), 30_000);
    return () => clearInterval(timer);
  }, [loadList]);

  // AC-7.6: at an open / close time the row changes within 5 s, without a reload.
  useEffect(() => {
    if (!list) return;
    const at = nextBoundary(list, serverNow().getTime());
    if (at === null || at - serverNow().getTime() > 2 * DAY) return;
    const t = setTimeout(() => void loadList(), Math.max(0, at - serverNow().getTime()) + 1000);
    return () => clearTimeout(t);
  }, [list, loadList]);

  /** "Vào thi": the lobby if the HV may start now; otherwise the attempt in progress or the new state (AC-8.4). */
  const enter = async (x: LearnerExam) => {
    setBusy(true);
    const v = await loadView(x.id);
    setBusy(false);
    const err = useLearnExamsStore.getState().viewError;
    if (!v) {
      if (err?.status === 404) navigate(NOT_FOUND_PATH, { replace: true });
      return;
    }
    if (v.attempt?.status === 'doing') navigate(myExamPath(x.id));
    else if (!v.canStart) {
      push('Bài thi không còn mở để bắt đầu.', 'warn');
      void loadList();
    } else setLobby(v);
  };

  const begin = async () => {
    if (!lobby) return;
    setBusy(true);
    const err = await start(lobby.exam.id);
    setBusy(false);
    if (!err || err.code === E.EXAM_SUBMITTED) {
      navigate(myExamPath(lobby.exam.id));
      return;
    }
    setLobby(null);
    if (err.status === 404) navigate(NOT_FOUND_PATH, { replace: true });
    else {
      push(err.status ? err.message : 'Mất kết nối — hãy thử lại.', 'warn');
      void loadList();
    }
  };

  if (lobby)
    return (
      <Lobby
        exam={lobby.exam}
        busy={busy}
        onBack={() => {
          setLobby(null);
          void loadList();
        }}
        onStart={() => void begin()}
      />
    );

  return (
    <div className="hv-pad xm-list" data-screen="S07">
      <h1 className="sr-only">Bài thi</h1>
      <p className="small muted">Bài thi của các lớp bạn đang học · giờ Việt Nam</p>
      {status === 'error' && !list && <ErrorState title="Không tải được danh sách bài thi." />}
      {!list && status !== 'error' && <Skeleton height={200} />}
      {list && !list.length && (
        <div className="empty">
          <h3>{M.noLearnerExams}</h3>
          <p>Khi giáo viên lên lịch bài thi cho lớp của bạn, bài thi sẽ hiện ở đây kèm giờ mở.</p>
        </div>
      )}
      {list?.map((x) => {
        const k = x.row.kind;
        const opensIn = Date.parse(x.opensAt) - now.getTime();
        const button =
          k === 'submitted' || k === 'noShow'
            ? { label: 'Xem kết quả', go: () => navigate(myExamResultPath(x.id)), primary: false }
            : k === 'doing'
              ? {
                  label: 'Tiếp tục làm bài',
                  go: () => navigate(myExamPath(x.id)),
                  primary: true,
                }
              : k === 'open'
                ? { label: 'Vào thi', go: () => void enter(x), primary: true }
                : null;
        return (
          <article
            key={x.id}
            className="card xm-row"
            data-exam={x.id}
            aria-labelledby={`xm-${x.id}`}
          >
            <h2 id={`xm-${x.id}`} className="xm-row__name">
              <Link to={myExamPath(x.id)}>{x.name}</Link>
            </h2>
            <p className="xm-row__meta small muted">
              <span>{x.classNames.join(', ')}</span>
              <span>{x.questionCount} câu hỏi</span>
              <span>{x.durationMin} phút</span>
            </p>
            <p className={`chip chip--${TONE[k]} xm-row__state`}>{learnerRowLine(x.row, x, now)}</p>
            {k === 'notOpen' && opensIn > 0 && opensIn < DAY && (
              <p className="small xm-row__countdown" aria-live="off">
                <Icon name="clock" size={14} /> Mở sau {formatHms(opensIn)}
              </p>
            )}
            {button && (
              <Button
                block
                variant={button.primary ? 'primary' : 'outline'}
                disabled={busy}
                onClick={button.go}
              >
                {button.label}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
