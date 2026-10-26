import { STEP_MESSAGES as SM } from '@sat/shared';
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ErrorState, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { stepPath } from '../classes/paths';
import { isNotFound, useHvRefusal } from '../classes/use-hv-refusal';
import { useToastStore } from '../toast/toast-store';
import { Flashcards } from './Flashcards';
import { type Unavailable, unavailableOf, useLearnStore } from './learn-store';
import type { StepNavState } from './StepViewPage';

/** S04 "Học flashcard" (REQ-16, REQ-17): the deck `?khoi=` of the step; marks are the HV's own (AC-16.7). */
export function FlashcardsPage() {
  const { classId = '', stepId = '' } = useParams();
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const data = useLearnStore((s) => s.step);
  const status = useLearnStore((s) => s.status);
  const error = useLearnStore((s) => s.error);
  const offline = useLearnStore((s) => s.offline);
  const load = useLearnStore((s) => s.load);
  const mark = useLearnStore((s) => s.mark);
  const flush = useLearnStore((s) => s.flush);
  const nav = (location.state ?? {}) as StepNavState;
  useHvRefusal(error);

  const leave = useCallback(
    (gone: Unavailable | null) => {
      if (!gone) return;
      push(gone.message, 'warn');
      navigate(gone.back, { replace: true });
    },
    [navigate, push],
  );

  useEffect(() => {
    if (useLearnStore.getState().step?.step.id === stepId) return;
    load(classId, stepId, { lesson: nav.lesson }).catch((err: unknown) =>
      leave(unavailableOf(err)),
    );
  }, [classId, stepId, load, nav.lesson, leave]);

  // AC-16.6: queued marks go out again when the connection is back, while S04 is open.
  useEffect(() => {
    const retry = () => void flush().then(leave);
    window.addEventListener('online', retry);
    const timer = window.setInterval(retry, 15_000);
    return () => {
      window.removeEventListener('online', retry);
      window.clearInterval(timer);
    };
  }, [flush, leave]);

  const deckId = search.get('khoi') ?? '';
  const current = data?.step.id === stepId ? data : null;
  const deck = current?.step.blocks.find((b) => b.type === 'deck' && b.id === deckId);
  useDocumentTitle(deck?.type === 'deck' ? deck.name || 'Bộ thẻ' : 'Học flashcard');

  if (!current) {
    if (status === 'error' && isNotFound(error)) return <NotFoundPage />;
    if (status === 'error' && !unavailableOf(error)) {
      return <ErrorState title="Không tải được bộ thẻ." />;
    }
    return <Skeleton height={320} />;
  }
  if (deck?.type !== 'deck') return <NotFoundPage />;
  const back = () =>
    navigate(stepPath(classId, stepId), {
      state: { lesson: current.lesson.id } satisfies StepNavState,
    });

  return (
    <article className="sv-page" data-screen="S04" aria-labelledby="s04-title">
      <h1 id="s04-title" className="sv-title">
        {deck.name.trim() || 'Bộ thẻ'}
      </h1>
      {offline && (
        <p className="st-notice" role="status">
          {SM.markOffline}
        </p>
      )}
      <Flashcards
        deck={deck}
        marks={current.marks}
        onBack={back}
        onMark={(cardId, m) =>
          void mark({ classId, stepId, deckId: deck.id, cardId, mark: m }).then(leave)
        }
      />
    </article>
  );
}
