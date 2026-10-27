import {
  type CardMark,
  type LearnStep,
  type MarkBody,
  STEP_ERROR_CODES,
  learnStepSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { ApiError, apiRequest } from '../../lib/api-client';

type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';

/** Where an open S03 / S04 sends the HV when the step became unavailable (AC-13.5). */
export interface Unavailable {
  message: string;
  back: string;
}

export const unavailableOf = (err: unknown): Unavailable | null => {
  if (!(err instanceof ApiError) || err.code !== STEP_ERROR_CODES.STEP_UNAVAILABLE) return null;
  const back = (err.details as { back?: string } | undefined)?.back ?? '/hv';
  return { message: err.message, back };
};

interface LearnState {
  status: LoadStatus;
  step: LearnStep | null;
  error: unknown;
  /** Marks not saved yet (offline — AC-16.6). */
  pending: MarkBody[];
  offline: boolean;

  /** `continuing` = an action of an open screen (AC-13.5); `lesson` = the Bài it showed. */
  load: (classId: string, stepId: string, opts?: LoadOptions) => Promise<void>;
  /** Saves a mark; offline it is queued and retried. Resolves with an unavailability to act on, if any. */
  mark: (body: MarkBody) => Promise<Unavailable | null>;
  /** Sends the queued marks again (connection back). */
  flush: () => Promise<Unavailable | null>;
}

/** `from` = the step S03 showed when "Trước" / "Tiếp" was pressed (checked first, AC-13.5). */
interface LoadOptions {
  continuing?: boolean;
  lesson?: string | undefined;
  from?: string | undefined;
}

const query = (opts?: LoadOptions) => {
  const q = new URLSearchParams();
  if (opts?.continuing) q.set('continue', '1');
  if (opts?.lesson) q.set('lesson', opts.lesson);
  if (opts?.from) q.set('from', opts.from);
  const s = q.toString();
  return s ? `?${s}` : '';
};

/** S03 / S04 (REQ-13, REQ-14, REQ-16). Nothing about viewing is sent to the API (AC-14.8). */
export const useLearnStore = create<LearnState>()((set, get) => {
  const send = async (body: MarkBody) => {
    const lesson = get().step?.lesson.id;
    await apiRequest(`/learn/marks${query({ lesson })}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  };
  const applyMark = (cardId: string, mark: CardMark) =>
    set((s) => (s.step ? { step: { ...s.step, marks: { ...s.step.marks, [cardId]: mark } } } : {}));

  return {
    status: 'idle',
    step: null,
    error: null,
    pending: [],
    offline: false,

    load: async (classId, stepId, opts) => {
      const keep = get().step?.step.id === stepId;
      set({ status: 'loading', error: null, ...(keep ? {} : { step: null }) });
      try {
        const step = learnStepSchema.parse(
          await apiRequest<unknown>(`/learn/classes/${classId}/steps/${stepId}${query(opts)}`),
        );
        set({ step, status: 'ok' });
      } catch (error) {
        set({ status: 'error', error });
        throw error;
      }
    },

    mark: async (body) => {
      applyMark(body.cardId, body.mark);
      try {
        await send(body);
        return null;
      } catch (err) {
        const gone = unavailableOf(err);
        if (gone) return gone;
        // Network or server trouble: keep the latest mark per card and retry later (AC-16.6).
        set((s) => ({
          offline: true,
          pending: [...s.pending.filter((p) => p.cardId !== body.cardId), body],
        }));
        return null;
      }
    },

    flush: async () => {
      const queue = get().pending;
      if (!queue.length) {
        set({ offline: false });
        return null;
      }
      const left: MarkBody[] = [];
      for (const body of queue) {
        try {
          await send(body);
        } catch (err) {
          const gone = unavailableOf(err);
          if (gone) {
            set({ pending: [], offline: false });
            return gone;
          }
          left.push(body);
        }
      }
      set({ pending: left, offline: left.length > 0 });
      return null;
    },
  };
});
