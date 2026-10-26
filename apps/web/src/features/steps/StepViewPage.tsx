import { useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Button, EmptyState, ErrorState, Icon, Skeleton } from '../../components';
import type { ApiError } from '../../lib/api-client';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { myLessonPath, setPath, setResultPath, stepPath } from '../classes/paths';
import { isNotFound, isNotStarted, useHvRefusal } from '../classes/use-hv-refusal';
import { useToastStore } from '../toast/toast-store';
import { unavailableOf, useLearnStore } from './learn-store';
import { StepBlocksView } from './StepBlocksView';

/** Navigation state of a move from an open S03 / S04 (AC-13.5). */
export interface StepNavState {
  continuing?: boolean;
  lesson?: string;
}

/** S03 "Xem bài học" (REQ-13, REQ-14, REQ-15, AC-10.3). Viewing is not recorded (AC-14.8). */
export function StepViewPage() {
  const { classId = '', stepId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const status = useLearnStore((s) => s.status);
  const data = useLearnStore((s) => s.step);
  const error = useLearnStore((s) => s.error);
  const load = useLearnStore((s) => s.load);
  const nav = (location.state ?? {}) as StepNavState;
  useDocumentTitle(data?.step.title || 'Xem bài học');
  useHvRefusal(error);

  /** AC-13.5: the step is no longer available — say so and go where the API says. */
  const leave = useCallback(
    (err: unknown) => {
      const gone = unavailableOf(err);
      if (!gone) return false;
      push(gone.message, 'warn');
      navigate(gone.back, { replace: true });
      return true;
    },
    [navigate, push],
  );

  useEffect(() => {
    load(classId, stepId, { continuing: !!nav.continuing, lesson: nav.lesson }).catch(leave);
  }, [classId, stepId, load, nav.continuing, nav.lesson, leave]);

  const current = data?.step.id === stepId ? data : null;
  if (!current) {
    if (status === 'error' && isNotFound(error)) return <NotFoundPage />;
    if (status === 'error' && isNotStarted(error)) {
      return <EmptyState title="Lớp chưa bắt đầu" description={(error as ApiError).message} />;
    }
    if (status === 'error' && !unavailableOf(error)) {
      return <ErrorState title="Không tải được bước học." />;
    }
    return <Skeleton height={320} />;
  }

  const go = (id: string) =>
    navigate(stepPath(classId, id), {
      replace: true,
      state: { continuing: true, lesson: current.lesson.id } satisfies StepNavState,
    });
  /** A block failed to load (expired link, network): check the step is still open, then reload it (AC-14.6). */
  const retry = () =>
    void load(classId, stepId, { continuing: true, lesson: current.lesson.id }).catch(leave);

  return (
    <article className="sv-page" data-screen="S03" aria-labelledby="s03-title">
      <header className="sv-head">
        <Link className="sv-back" to={myLessonPath(classId, current.lesson.id)}>
          <Icon name="back" size={18} />
          <span className="sr-only">Về trang bài</span>
        </Link>
        <div>
          <p className="small muted">
            {current.lesson.name} · Bước {current.position}/{current.total}
          </p>
          <h1 id="s03-title" className="sv-title">
            {current.step.title}
          </h1>
          {current.step.goal.trim() && <p className="small muted">Mục tiêu: {current.step.goal}</p>}
        </div>
      </header>
      <StepBlocksView
        blocks={current.step.blocks}
        marks={current.marks}
        onRetry={retry}
        onOpenDeck={(deckId) =>
          navigate(`${stepPath(classId, stepId)}/the-tu?khoi=${encodeURIComponent(deckId)}`, {
            state: { lesson: current.lesson.id } satisfies StepNavState,
          })
        }
      />
      {current.practice.length > 0 && (
        <div className="sv-practice">
          {current.practice.map((s) =>
            s.state === 'closed' ? (
              <div key={s.id} className="sv-practice__row">
                <Button block variant="outline" disabled>
                  <Icon name="pen" size={18} />
                  Luyện tập: {s.title}
                </Button>
                <span className="chip chip--todo">Chưa mở</span>
              </div>
            ) : (
              <Link
                key={s.id}
                className="btn btn--outline btn--block sv-practice__link"
                to={s.state === 'done' ? setResultPath(classId, s.id) : setPath(classId, s.id)}
              >
                <Icon name="pen" size={18} />
                Luyện tập: {s.title}
              </Link>
            ),
          )}
        </div>
      )}
      <nav className="sv-nav" aria-label="Chuyển bước học">
        {current.prev ? (
          <Button
            variant="outline"
            className="sv-nav__btn"
            onClick={() => go(current.prev?.id ?? '')}
          >
            <span className="small">‹ Trước</span>
            <span className="sv-nav__name">{current.prev.title}</span>
          </Button>
        ) : (
          <span />
        )}
        {current.next ? (
          <Button className="sv-nav__btn" onClick={() => go(current.next?.id ?? '')}>
            <span className="small">Tiếp ›</span>
            <span className="sv-nav__name">{current.next.title}</span>
          </Button>
        ) : (
          <Button onClick={() => navigate(myLessonPath(classId, current.lesson.id))}>
            Về trang bài
          </Button>
        )}
      </nav>
    </article>
  );
}
