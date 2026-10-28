import {
  type Answer,
  type Answers,
  type ExerciseView,
  type Review,
  type SetSubmissions,
  type Submission,
  exerciseViewSchema,
  lessonSetsSchema,
  newBlockId,
  reviewSchema,
  setSubmissionsSchema,
  submissionSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { ApiError, apiRequest } from '../../lib/api-client';

/** `saved` / `saving` / `offline` (AC-14.4, AC-14.5); `refused` = the server will not take answers any more. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'refused';
type Status = 'idle' | 'loading' | 'ok' | 'error';

const SAVE_AFTER_MS = 800;
const RETRY_MS = 3000;

interface ExerciseState {
  classId: string;
  setId: string;
  status: Status;
  error: ApiError | null;
  view: ExerciseView | null;
  /** The HV left the start screen ("Bắt đầu làm" / "Tiếp tục làm", AC-14.1). */
  entered: boolean;
  /** Answers on screen (saved or not). */
  answers: Answers;
  /** Question ids changed since the last successful save. */
  pending: string[];
  index: number;
  saveState: SaveState;
  /** Refusal of a save / submit to show (AC-14.9, AC-21.6, AC-23.9, AC-15.2). */
  refusal: ApiError | null;
  submitting: boolean;
  submitOffline: boolean;
  /** One key per submission attempt (AC-15.5): a retry after a lost connection reuses it. */
  submitKey: string;
  review: Review | null;
  reviewStatus: Status;
  submission: Submission | null;
  submissionStatus: Status;
  setSubmissions: SetSubmissions['items'];
  setSubmissionsStatus: Status;
  /** T09: submissions of each set of the open Bài by set id (AC-18.1, AC-18.2). */
  lockCounts: Record<string, number>;

  load: (classId: string, setId: string) => Promise<void>;
  start: () => Promise<void>;
  answer: (questionId: string, a: Answer) => void;
  go: (index: number) => void;
  flush: () => Promise<void>;
  submit: () => Promise<boolean>;
  loadReview: (classId: string, setId: string) => Promise<void>;
  /** T14 (GV). */
  loadSubmission: (q: { classId: string; studentId: string; setId: string }) => Promise<void>;
  /** T04 "Bài nộp" of one set in one class (AC-20.1). */
  loadSetSubmissions: (classId: string, setId: string) => Promise<void>;
  loadLockCounts: (lessonId: string) => Promise<void>;
}

let timer: ReturnType<typeof setTimeout> | null = null;
const base = (s: Pick<ExerciseState, 'classId' | 'setId'>) =>
  `/learn/classes/${s.classId}/sets/${s.setId}`;
const isNetwork = (err: unknown) => !(err instanceof ApiError);

export const useExerciseStore = create<ExerciseState>()((set, get) => {
  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void get().flush(), ms);
  };
  const applyView = (view: ExerciseView) =>
    set({
      view,
      status: 'ok',
      answers: view.attempt?.answers ?? {},
      index: view.attempt?.lastIndex ?? 0,
      pending: [],
      saveState: 'idle',
    });

  return {
    classId: '',
    setId: '',
    status: 'idle',
    error: null,
    view: null,
    entered: false,
    answers: {},
    pending: [],
    index: 0,
    saveState: 'idle',
    refusal: null,
    submitting: false,
    submitOffline: false,
    submitKey: newBlockId(),
    review: null,
    reviewStatus: 'idle',
    submission: null,
    submissionStatus: 'idle',
    setSubmissions: [],
    setSubmissionsStatus: 'idle',
    lockCounts: {},

    async load(classId, setId) {
      if (timer) clearTimeout(timer);
      set({
        classId,
        setId,
        status: 'loading',
        error: null,
        refusal: null,
        submitOffline: false,
        entered: false,
      });
      try {
        applyView(exerciseViewSchema.parse(await apiRequest(base({ classId, setId }))));
        set({ submitKey: newBlockId() });
      } catch (err) {
        set({ status: 'error', error: err instanceof ApiError ? err : null });
      }
    },

    async start() {
      set({ refusal: null });
      // "Tiếp tục làm" asks the server too: the attempt may have been submitted elsewhere since this screen loaded (AC-17.7).
      // The "set was updated" notice is shown once: the server cleared it when this screen loaded (AC-18.4).
      const updated = get().view?.attempt?.updated ?? false;
      try {
        const view = exerciseViewSchema.parse(
          await apiRequest(`${base(get())}/start`, { method: 'POST' }),
        );
        applyView(
          updated && view.attempt ? { ...view, attempt: { ...view.attempt, updated: true } } : view,
        );
        set({ entered: true });
      } catch (err) {
        if (err instanceof ApiError) set({ refusal: err });
        // Offline: continue the attempt already loaded; autosave retries (AC-14.5, AC-14.7).
        else if (get().view?.attempt) set({ entered: true });
        else throw err;
      }
    },

    answer(questionId, a) {
      const { answers, pending, saveState } = get();
      if (saveState === 'refused') return;
      set({
        answers: { ...answers, [questionId]: a },
        pending: pending.includes(questionId) ? pending : [...pending, questionId],
        saveState: saveState === 'offline' ? 'offline' : 'saving',
      });
      schedule(SAVE_AFTER_MS);
    },

    go(index) {
      set({ index });
      schedule(SAVE_AFTER_MS);
    },

    /** Saves the pending answers (and the question being viewed); retries while offline (AC-14.5). */
    async flush() {
      const { pending, answers, index, view, saveState } = get();
      if (!view?.attempt || saveState === 'refused') return;
      const sent = pending;
      set({ saveState: 'saving' });
      try {
        await apiRequest(`${base(get())}/attempt`, {
          method: 'PUT',
          body: JSON.stringify({
            answers: Object.fromEntries(sent.map((id) => [id, answers[id] ?? {}])),
            lastIndex: index,
          }),
        });
        const left = get().pending.filter((id) => !sent.includes(id));
        set({ pending: left, saveState: left.length ? 'saving' : 'saved' });
        if (left.length) schedule(SAVE_AFTER_MS);
      } catch (err) {
        if (isNetwork(err)) {
          set({ saveState: 'offline' });
          schedule(RETRY_MS);
        } else set({ saveState: 'refused', refusal: err as ApiError });
      }
    },

    async submit() {
      const { answers, submitKey } = get();
      if (timer) clearTimeout(timer);
      set({ submitting: true, submitOffline: false, refusal: null });
      try {
        await apiRequest(`${base(get())}/submit`, {
          method: 'POST',
          body: JSON.stringify({ submitKey, answers }),
        });
        set({ submitting: false, pending: [], saveState: 'saved' });
        return true;
      } catch (err) {
        if (isNetwork(err)) set({ submitting: false, submitOffline: true });
        else set({ submitting: false, refusal: err as ApiError });
        return false;
      }
    },

    async loadSubmission(q) {
      set({ submissionStatus: 'loading', submission: null, error: null });
      try {
        const query = new URLSearchParams(q).toString();
        const submission = submissionSchema.parse(
          await apiRequest(`/exercises/submissions?${query}`),
        );
        set({ submission, submissionStatus: 'ok' });
      } catch (err) {
        set({ submissionStatus: 'error', error: err instanceof ApiError ? err : null });
      }
    },

    async loadSetSubmissions(classId, setId) {
      set({ setSubmissionsStatus: 'loading', setSubmissions: [] });
      try {
        const { items } = setSubmissionsSchema.parse(
          await apiRequest(`/exercises/classes/${classId}/sets/${setId}/submissions`),
        );
        set({ setSubmissions: items, setSubmissionsStatus: 'ok' });
      } catch {
        set({ setSubmissionsStatus: 'error' });
      }
    },

    async loadLockCounts(lessonId) {
      try {
        const { sets } = lessonSetsSchema.parse(
          await apiRequest(`/exercises/lessons/${lessonId}/sets`),
        );
        set({ lockCounts: Object.fromEntries(sets.map((x) => [x.id, x.submissions])) });
      } catch {
        // The lock is enforced by the API (409 SET_LOCKED); without counts the banner waits for the next load.
      }
    },

    async loadReview(classId, setId) {
      set({ reviewStatus: 'loading', review: null, error: null });
      try {
        const review = reviewSchema.parse(await apiRequest(`${base({ classId, setId })}/review`));
        set({ review, reviewStatus: 'ok' });
      } catch (err) {
        set({ reviewStatus: 'error', error: err instanceof ApiError ? err : null });
      }
    },
  };
});
