import {
  EXAM_ERROR_CODES as E,
  EXAM_MESSAGES as M,
  type Exam,
  type ExamClassOption,
  type ExamClassResults,
  type ExamDraft,
  type ExamIssue,
  type ExamListItem,
  type ExamSubmission,
  type ExerciseSetContent,
  type FileRef,
  type Question,
  type SubQuestion,
  durationProblem,
  examClassOptionsSchema,
  examClassResultsSchema,
  examIssues,
  examListSchema,
  examSchema,
  examSubmissionSchema,
  formatVnDateTimeInput,
  nameProblem,
  parseVnDateTime,
} from '@sat/shared';
import { create } from 'zustand';
import { ApiError, apiRequest } from '../../lib/api-client';
import type { ImageTarget } from '../exercises/set-editing';
import { setOf } from '../exercises/set-editing';
import { serverNow, syncServer } from './server-clock';

type Status = 'idle' | 'loading' | 'ok' | 'error';

/** The T22 working copy: times and duration as typed (dd/MM/yyyy HH:mm, minutes). */
export interface ExamWork {
  name: string;
  content: ExerciseSetContent;
  classIds: string[];
  open: string;
  dur: string;
  close: string;
}

export type FieldKey = 'name' | 'instructions' | 'classes' | 'open' | 'dur' | 'close';

const blank = (): ExamWork => ({
  name: '',
  content: { instructions: '', stepId: null, questions: [] },
  classIds: [],
  open: '',
  dur: '',
  close: '',
});

const workOf = (e: Exam): ExamWork => ({
  name: e.name,
  content: setOf(e.content),
  classIds: e.classIds,
  open: e.opensAt ? formatVnDateTimeInput(new Date(e.opensAt)) : '',
  dur: e.durationMin === null ? '' : String(e.durationMin),
  close: e.closesAt ? formatVnDateTimeInput(new Date(e.closesAt)) : '',
});

const fingerprint = (w: ExamWork) => JSON.stringify(w);

/** Typed text → API values; problems of the text itself per field (AC-2.3, AC-3.2). */
export function readWork(w: ExamWork): {
  draft: ExamDraft;
  errors: Partial<Record<FieldKey, string>>;
} {
  const errors: Partial<Record<FieldKey, string>> = {};
  const time = (text: string, key: 'open' | 'close') => {
    if (!text.trim()) return null;
    const d = parseVnDateTime(text);
    if (!d) errors[key] = M.dateTimeInvalid;
    return d;
  };
  const durText = w.dur.trim();
  const dur = durText === '' ? null : /^\d+$/.test(durText) ? Number(durText) : NaN;
  const durIssue = durationProblem(Number.isNaN(dur) ? 1.5 : dur);
  if (durIssue) errors.dur = durIssue;
  const nameIssue = nameProblem(w.name);
  if (nameIssue) errors.name = nameIssue;
  return {
    draft: {
      name: w.name,
      content: w.content,
      classIds: w.classIds,
      opensAt: time(w.open, 'open'),
      durationMin: Number.isNaN(dur) ? null : dur,
      closesAt: time(w.close, 'close'),
    },
    errors,
  };
}

const bodyOf = (d: ExamDraft) => ({
  name: d.name,
  content: d.content,
  classIds: d.classIds,
  opensAt: d.opensAt?.toISOString() ?? null,
  durationMin: d.durationMin,
  closesAt: d.closesAt?.toISOString() ?? null,
});

interface ExamsState {
  /* T10 */
  list: ExamListItem[] | null;
  listStatus: Status;
  loadList: () => Promise<void>;

  /* T22 */
  options: ExamClassOption[];
  loadOptions: () => Promise<void>;
  id: string | null;
  exam: Exam | null;
  work: ExamWork;
  saved: string;
  status: Status;
  error: ApiError | null;
  busy: boolean;
  savedAt: Date | null;
  /** AC-3.5 / AC-4.1: unmet conditions, each with its target. */
  issues: ExamIssue[];
  fieldErrors: Partial<Record<FieldKey, string>>;
  /** Banner of a refused save (AC-2.7, AC-4.3, AC-4.4). */
  notice: string | null;
  /** Paths of question fields to show errors for ("*" = all). */
  touched: Set<string>;
  openNew: () => void;
  load: (id: string) => Promise<void>;
  edit: (patch: Partial<ExamWork>) => void;
  touch: (path: string) => void;
  patchImage: (target: ImageTarget, image: FileRef | null) => void;
  save: () => Promise<boolean>;
  schedule: () => Promise<boolean>;
  unschedule: () => Promise<boolean>;
  remove: (id: string) => Promise<ApiError | null>;
  archive: (id: string) => Promise<ApiError | null>;
  restore: (id: string) => Promise<ApiError | null>;
  duplicate: (id: string) => Promise<string | null>;

  /* T16 / T14 */
  results: ExamClassResults | null;
  resultsStatus: Status;
  resultsError: ApiError | null;
  loadResults: (id: string, classId?: string | null, quiet?: boolean) => Promise<void>;
  submission: ExamSubmission | null;
  submissionStatus: Status;
  submissionError: ApiError | null;
  loadSubmission: (q: { examId: string; studentId: string; classId: string }) => Promise<void>;
}

export const isDirty = (s: Pick<ExamsState, 'work' | 'saved'>): boolean =>
  fingerprint(s.work) !== s.saved;

export const useExamsStore = create<ExamsState>()((set, get) => {
  const applyExam = (exam: Exam, keepWork = false) => {
    syncServer(exam.serverNow);
    const work = keepWork ? get().work : workOf(exam);
    set({
      id: exam.id,
      exam,
      work,
      saved: keepWork ? get().saved : fingerprint(work),
      status: 'ok',
      error: null,
    });
  };

  /** Refusals of a save / schedule: shown where they belong, the GV's text kept (AC-2.7, AC-4.3). */
  const refused = (err: unknown) => {
    if (!(err instanceof ApiError)) {
      set({ notice: 'Chưa lưu được do mất kết nối. Hãy thử lại.' });
      return;
    }
    const details = err.details as
      { field?: FieldKey; issues?: ExamIssue[]; path?: string } | undefined;
    if (err.code === E.INVALID_EXAM && details?.field)
      set({ fieldErrors: { ...get().fieldErrors, [details.field]: err.message } });
    else if (err.code === E.EXAM_NOT_READY) set({ issues: details?.issues ?? [] });
    else if (err.code === E.EXAM_CLOSE_EARLIER) set({ fieldErrors: { close: err.message } });
    else if (err.code === E.EXAM_HAS_ATTEMPTS) set({ fieldErrors: { classes: err.message } });
    else if (err.code === 'INVALID_CONTENT') set({ notice: err.message, touched: new Set(['*']) });
    else if (err.code === E.EXAM_LOCKED) {
      set({ notice: err.message });
      // The lock shows from now on; the GV's text stays on screen.
      const id = get().id;
      if (id)
        void apiRequest(`/exams/${id}`)
          .then((x) => set({ exam: examSchema.parse(x) }))
          .catch(() => undefined);
    } else set({ notice: err.message });
  };

  const startWrite = () => set({ busy: true, notice: null, issues: [], fieldErrors: {} });

  const simple = async (path: string, init: RequestInit) => {
    try {
      const x = await apiRequest(path, init);
      if (x && get().id) applyExam(examSchema.parse(x));
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
        const r = examListSchema.parse(await apiRequest('/exams'));
        syncServer(r.serverNow);
        set({ list: r.items, listStatus: 'ok' });
      } catch {
        set({ listStatus: 'error' });
      }
    },

    options: [],
    async loadOptions() {
      try {
        set({ options: examClassOptionsSchema.parse(await apiRequest('/exams/classes')).items });
      } catch {
        // The picker stays empty; saving still works for the classes already assigned.
      }
    },
    id: null,
    exam: null,
    work: blank(),
    saved: fingerprint(blank()),
    status: 'idle',
    error: null,
    busy: false,
    savedAt: null,
    issues: [],
    fieldErrors: {},
    notice: null,
    touched: new Set(),

    openNew() {
      const work = blank();
      set({
        id: null,
        exam: null,
        work,
        saved: fingerprint(work),
        status: 'ok',
        error: null,
        savedAt: null,
        issues: [],
        fieldErrors: {},
        notice: null,
        touched: new Set(),
      });
    },

    async load(id) {
      set({
        status: 'loading',
        error: null,
        savedAt: null,
        issues: [],
        fieldErrors: {},
        notice: null,
        touched: new Set(),
      });
      try {
        applyExam(examSchema.parse(await apiRequest(`/exams/${id}`)));
      } catch (err) {
        set({ status: 'error', error: err instanceof ApiError ? err : null });
      }
    },

    edit(patch) {
      const fieldErrors = { ...get().fieldErrors };
      for (const k of Object.keys(patch)) {
        const key = (k === 'classIds' ? 'classes' : k) as FieldKey;
        delete fieldErrors[key];
      }
      set({ work: { ...get().work, ...patch }, fieldErrors });
    },

    touch(path) {
      set({ touched: new Set([...get().touched, path]) });
    },

    patchImage(target, image) {
      const { work } = get();
      const put = <Q extends Question | SubQuestion>(q: Q): Q => {
        if (q.id !== target.ownerId) return q;
        if (!target.optionId) return { ...q, image };
        if (q.type !== 'mcq' && q.type !== 'vocab') return q;
        return {
          ...q,
          options: q.options.map((o) => (o.id === target.optionId ? { ...o, image } : o)),
        };
      };
      const questions = work.content.questions.map((q) =>
        q.type === 'reading' ? put({ ...q, subs: q.subs.map(put) }) : put(q),
      );
      set({ work: { ...work, content: { ...work.content, questions } } });
    },

    /** "Lưu nháp" (AC-2.2) / "Lưu thay đổi" (AC-4.1 … AC-5.5). */
    async save() {
      const { draft, errors } = readWork(get().work);
      startWrite();
      if (Object.keys(errors).length) {
        set({ busy: false, fieldErrors: errors });
        return false;
      }
      const { id, exam } = get();
      // AC-4.1: a scheduled exam must still meet every condition (checked again by the server).
      if (exam && exam.state !== 'draft' && exam.state !== 'closed' && exam.state !== 'archived') {
        const openChanged = (exam.opensAt ?? null) !== (draft.opensAt?.toISOString() ?? null);
        const issues = exam.locked
          ? []
          : examIssues(draft, serverNow(), { checkOpen: openChanged });
        if (issues.length) {
          set({ busy: false, issues, touched: new Set(['*']) });
          return false;
        }
      }
      try {
        const x = id
          ? await apiRequest(`/exams/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...bodyOf(draft), expectedVersion: exam?.version ?? 0 }),
            })
          : await apiRequest('/exams', { method: 'POST', body: JSON.stringify(bodyOf(draft)) });
        applyExam(examSchema.parse(x));
        set({ busy: false, savedAt: serverNow() });
        return true;
      } catch (err) {
        set({ busy: false });
        refused(err);
        return false;
      }
    },

    /** "Lên lịch" (AC-3.4, AC-3.5): every unmet condition listed, nothing changes until all are met. */
    async schedule() {
      const { draft, errors } = readWork(get().work);
      startWrite();
      const issues = examIssues(draft, serverNow(), { checkOpen: true });
      if (Object.keys(errors).length || issues.length) {
        set({ busy: false, fieldErrors: errors, issues, touched: new Set(['*']) });
        return false;
      }
      try {
        let { id, exam } = get();
        if (!id) {
          const created = examSchema.parse(
            await apiRequest('/exams', { method: 'POST', body: JSON.stringify(bodyOf(draft)) }),
          );
          applyExam(created);
          id = created.id;
          exam = created;
        }
        const x = await apiRequest(`/exams/${id}/schedule`, {
          method: 'POST',
          body: JSON.stringify({ ...bodyOf(draft), expectedVersion: exam?.version ?? 0 }),
        });
        applyExam(examSchema.parse(x));
        set({ busy: false, savedAt: serverNow() });
        return true;
      } catch (err) {
        set({ busy: false });
        refused(err);
        return false;
      }
    },

    async unschedule() {
      const { id, exam } = get();
      if (!id) return false;
      startWrite();
      const err = await simple(`/exams/${id}/unschedule`, {
        method: 'POST',
        body: JSON.stringify({ expectedVersion: exam?.version ?? 0 }),
      });
      set({ busy: false });
      if (err) set({ notice: err.message });
      return !err;
    },

    async remove(id) {
      try {
        await apiRequest(`/exams/${id}`, { method: 'DELETE' });
        set({ list: get().list?.filter((x) => x.id !== id) ?? null });
        return null;
      } catch (err) {
        return err instanceof ApiError ? err : new ApiError(0, 'NETWORK', 'Mất kết nối', '');
      }
    },
    archive: (id) => simple(`/exams/${id}/archive`, { method: 'POST' }),
    restore: (id) => simple(`/exams/${id}/restore`, { method: 'POST' }),
    async duplicate(id) {
      try {
        return examSchema.parse(await apiRequest(`/exams/${id}/duplicate`, { method: 'POST' })).id;
      } catch {
        return null;
      }
    },

    results: null,
    resultsStatus: 'idle',
    resultsError: null,
    async loadResults(id, classId, quiet = false) {
      if (!quiet) set({ resultsStatus: 'loading', resultsError: null });
      try {
        const q = classId ? `?classId=${encodeURIComponent(classId)}` : '';
        const r = examClassResultsSchema.parse(await apiRequest(`/exams/${id}/results${q}`));
        syncServer(r.serverNow);
        set({ results: r, resultsStatus: 'ok' });
      } catch (err) {
        if (!quiet)
          set({ resultsStatus: 'error', resultsError: err instanceof ApiError ? err : null });
      }
    },

    submission: null,
    submissionStatus: 'idle',
    submissionError: null,
    async loadSubmission({ examId, studentId, classId }) {
      set({ submissionStatus: 'loading', submission: null, submissionError: null });
      try {
        const s = examSubmissionSchema.parse(
          await apiRequest(
            `/exams/${examId}/submissions/${studentId}?classId=${encodeURIComponent(classId)}`,
          ),
        );
        set({ submission: s, submissionStatus: 'ok' });
      } catch (err) {
        set({
          submissionStatus: 'error',
          submissionError: err instanceof ApiError ? err : null,
        });
      }
    },
  };
});
