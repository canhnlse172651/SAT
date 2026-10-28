import {
  type Answer,
  type Answers,
  EXAM_ERROR_CODES as E,
  type ExamAttempt,
  type LearnerExam,
  type LearnerExamView,
  examAttemptSchema,
  examClockSchema,
  learnerExamListSchema,
  learnerExamViewSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { ApiError, apiRequest } from '../../lib/api-client';
import { newToken, serverNow, syncServer } from './server-clock';

type Status = 'idle' | 'loading' | 'ok' | 'error';
/** AC-9.3, AC-10.1: what the autosave line says; `refused` = the server takes no more answers. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'refused';

const SAVE_AFTER_MS = 800;
const RETRY_MS = 2000;

/** This page load's token: the device / tab that holds the attempt (AC-10.4). */
const HOLDER = newToken();
const isNetwork = (err: unknown) => !(err instanceof ApiError);

interface LearnExamsState {
  /* S07 */
  list: LearnerExam[] | null;
  listStatus: Status;
  loadList: () => Promise<void>;

  /* S07 lobby / S08 result */
  view: LearnerExamView | null;
  viewStatus: Status;
  viewError: ApiError | null;
  loadView: (id: string, quiet?: boolean) => Promise<LearnerExamView | null>;

  /* S08 attempt */
  attempt: ExamAttempt | null;
  endsAt: number;
  answers: Answers;
  pending: string[];
  index: number;
  saveState: SaveState;
  savedAt: Date | null;
  /** Another device or tab took the attempt (AC-10.4). */
  held: boolean;
  /** The HV left every assigned class (AC-12.5). */
  removed: boolean;
  /** "Hết giờ — bài thi đã được nộp tự động lúc HH:mm" (AC-12.3). */
  autoAt: Date | null;
  /** Submitted (manually) in this page: show the result. */
  done: boolean;
  submitting: boolean;
  submitOffline: boolean;
  submitKey: string;
  start: (id: string) => Promise<ApiError | null>;
  open: (id: string) => Promise<ApiError | null>;
  answer: (questionId: string, a: Answer) => void;
  go: (index: number) => void;
  flush: () => Promise<void>;
  submit: () => Promise<boolean>;
  timeUp: () => Promise<void>;
  poll: () => Promise<void>;
  leave: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useLearnExamsStore = create<LearnExamsState>()((set, get) => {
  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void get().flush(), ms);
  };
  const base = () => `/learn/exams/${get().attempt?.examId ?? ''}`;

  const applyAttempt = (a: ExamAttempt) => {
    syncServer(a.serverNow);
    set({
      attempt: a,
      endsAt: Date.parse(a.endsAt),
      answers: a.answers,
      pending: [],
      index: a.lastIndex,
      saveState: 'idle',
      savedAt: null,
      held: false,
      removed: false,
      autoAt: null,
      done: false,
      submitting: false,
      submitOffline: false,
      submitKey: newToken(),
    });
  };

  /** A refusal that ends the attempt on this device: submitted (auto or not), held elsewhere, removed (REQ-10 … REQ-12). */
  const ended = (err: ApiError) => {
    const auto = (err.details as { auto?: boolean } | undefined)?.auto;
    if (err.code === E.EXAM_HELD_ELSEWHERE) set({ held: true, saveState: 'refused' });
    else if (err.code === E.EXAM_NOT_MEMBER) set({ removed: true, saveState: 'refused' });
    else if (err.code === E.EXAM_TIME_OVER || (err.code === E.EXAM_SUBMITTED && auto))
      set({ autoAt: new Date(get().endsAt), saveState: 'refused' });
    else if (err.code === E.EXAM_SUBMITTED) set({ done: true, saveState: 'refused' });
    else set({ saveState: 'refused' });
  };

  const enter = async (id: string, action: 'start' | 'open') => {
    try {
      const a = examAttemptSchema.parse(
        await apiRequest(`/learn/exams/${id}/${action}`, {
          method: 'POST',
          body: JSON.stringify({ holder: HOLDER }),
        }),
      );
      applyAttempt(a);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err : new ApiError(0, 'NETWORK', 'Mất kết nối', '');
    }
  };

  return {
    list: null,
    listStatus: 'idle',
    async loadList() {
      set({ listStatus: get().list ? 'ok' : 'loading' });
      try {
        const r = learnerExamListSchema.parse(await apiRequest('/learn/exams'));
        syncServer(r.serverNow);
        set({ list: r.items, listStatus: 'ok' });
      } catch {
        set({ listStatus: 'error' });
      }
    },

    view: null,
    viewStatus: 'idle',
    viewError: null,
    async loadView(id, quiet = false) {
      if (!quiet) set({ viewStatus: 'loading', viewError: null });
      try {
        const v = learnerExamViewSchema.parse(await apiRequest(`/learn/exams/${id}`));
        syncServer(v.serverNow);
        set({ view: v, viewStatus: 'ok', viewError: null });
        return v;
      } catch (err) {
        if (!quiet) set({ viewStatus: 'error', viewError: err instanceof ApiError ? err : null });
        return null;
      }
    },

    attempt: null,
    endsAt: 0,
    answers: {},
    pending: [],
    index: 0,
    saveState: 'idle',
    savedAt: null,
    held: false,
    removed: false,
    autoAt: null,
    done: false,
    submitting: false,
    submitOffline: false,
    submitKey: newToken(),

    start: (id) => enter(id, 'start'),
    open: (id) => enter(id, 'open'),

    answer(questionId, a) {
      const { answers, pending, saveState, held, removed, autoAt } = get();
      if (held || removed || autoAt || saveState === 'refused') return;
      set({
        answers: { ...answers, [questionId]: a },
        pending: pending.includes(questionId) ? pending : [...pending, questionId],
        saveState: saveState === 'offline' ? 'offline' : 'saving',
      });
      schedule(SAVE_AFTER_MS);
    },

    go(index) {
      set({ index });
      if (!get().held && !get().removed) schedule(SAVE_AFTER_MS);
    },

    /** AC-9.3, AC-10.2: the changed answers (and the question viewed); retried while offline. */
    async flush() {
      const { pending, answers, index, attempt, saveState, held } = get();
      if (!attempt || saveState === 'refused' || held) return;
      const sent = pending;
      if (saveState !== 'offline') set({ saveState: 'saving' });
      try {
        await apiRequest(`${base()}/attempt`, {
          method: 'PUT',
          body: JSON.stringify({
            holder: HOLDER,
            answers: Object.fromEntries(sent.map((id) => [id, answers[id] ?? {}])),
            lastIndex: index,
          }),
        });
        const left = get().pending.filter((id) => !sent.includes(id));
        set({ pending: left, saveState: left.length ? 'saving' : 'saved', savedAt: serverNow() });
        if (left.length) schedule(SAVE_AFTER_MS);
      } catch (err) {
        if (isNetwork(err)) {
          set({ saveState: 'offline' });
          schedule(RETRY_MS);
        } else ended(err as ApiError);
      }
    },

    /** AC-11.2, AC-11.3: one submission per key; a lost connection keeps everything (AC-11.4). */
    async submit() {
      const { answers, submitKey, attempt } = get();
      if (!attempt) return false;
      if (timer) clearTimeout(timer);
      set({ submitting: true, submitOffline: false });
      try {
        await apiRequest(`${base()}/submit`, {
          method: 'POST',
          body: JSON.stringify({ holder: HOLDER, submitKey, answers }),
        });
        const auto = serverNow().getTime() >= get().endsAt;
        set({
          submitting: false,
          pending: [],
          saveState: 'saved',
          ...(auto ? { autoAt: new Date(get().endsAt) } : { done: true }),
        });
        return true;
      } catch (err) {
        if (isNetwork(err)) set({ submitting: false, submitOffline: true });
        else {
          set({ submitting: false });
          ended(err as ApiError);
        }
        return false;
      }
    },

    /** AC-12.1: at the end the answers on screen go with the automatic submission (accepted until end + 10 s). */
    async timeUp() {
      const { autoAt, done, held, removed, submitting } = get();
      if (autoAt || done || submitting) return;
      if (held || removed) {
        set({ autoAt: new Date(get().endsAt), saveState: 'refused' });
        return;
      }
      await get().submit();
      if (!get().autoAt && !get().done && !get().submitOffline)
        set({ autoAt: new Date(get().endsAt) });
    },

    /** 5 s: server time, a later close (AC-5.2), the device holding the attempt (AC-10.4), removal (AC-12.5). */
    async poll() {
      const { attempt } = get();
      if (!attempt) return;
      try {
        const c = examClockSchema.parse(await apiRequest(`${base()}/clock`));
        syncServer(c.serverNow);
        if (c.status === 'submitted') {
          if (!get().done && !get().autoAt)
            set(
              c.auto
                ? { autoAt: new Date(c.submittedAt ?? get().endsAt), saveState: 'refused' }
                : { done: true, saveState: 'refused' },
            );
          return;
        }
        set({
          ...(c.endsAt ? { endsAt: Date.parse(c.endsAt) } : {}),
          held: !!c.holder && c.holder !== HOLDER,
          removed: c.removed,
        });
        if (get().saveState === 'offline') void get().flush();
      } catch (err) {
        if (isNetwork(err) && get().pending.length) set({ saveState: 'offline' });
      }
    },

    leave() {
      if (timer) clearTimeout(timer);
      set({ attempt: null, autoAt: null, done: false, held: false, removed: false, pending: [] });
    },
  };
});
