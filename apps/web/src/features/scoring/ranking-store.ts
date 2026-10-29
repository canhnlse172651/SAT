import {
  type ClassRanking,
  type LearnRanking,
  type RankingClass,
  type StudentBreakdown,
  classRankingSchema,
  learnRankingClassesSchema,
  learnRankingSchema,
  studentBreakdownSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { ApiError, apiRequest } from '../../lib/api-client';

/** `notFound`: not a member / another workspace / missing — "Không tìm thấy lớp." (AC-9.2, AC-9.4). */
type Status = 'idle' | 'loading' | 'ok' | 'error' | 'notFound';

const LAST_CLASS_KEY = 'sat.s09.class';

/** AC-8.2: the class last viewed on S09, per device (a convenience; missing storage just means "first class"). */
export const lastViewedClass = {
  get(): string | null {
    try {
      return localStorage.getItem(LAST_CLASS_KEY);
    } catch {
      return null;
    }
  },
  set(id: string): void {
    try {
      localStorage.setItem(LAST_CLASS_KEY, id);
    } catch {
      /* storage unavailable */
    }
  },
};

const failure = (err: unknown): Status =>
  err instanceof ApiError && err.status === 404 ? 'notFound' : 'error';

interface RankingState {
  /* S09 (HV) */
  classes: RankingClass[] | null;
  classesStatus: Status;
  board: LearnRanking | null;
  boardStatus: Status;
  loadClasses: () => Promise<RankingClass[] | null>;
  /** AC-13.3, AC-13.4: always fetches; on failure the old board is dropped, never shown as current. */
  loadBoard: (classId: string) => Promise<void>;

  /* T04 tab Xếp hạng (GV) */
  table: ClassRanking | null;
  tableStatus: Status;
  details: Record<string, { status: Status; data: StudentBreakdown | null }>;
  loadTable: (classId: string) => Promise<void>;
  loadDetail: (classId: string, studentId: string) => Promise<void>;
}

export const useRankingStore = create<RankingState>()((set) => ({
  classes: null,
  classesStatus: 'idle',
  board: null,
  boardStatus: 'idle',
  table: null,
  tableStatus: 'idle',
  details: {},

  loadClasses: async () => {
    set({ classesStatus: 'loading' });
    try {
      const { items } = learnRankingClassesSchema.parse(
        await apiRequest<unknown>('/learn/ranking/classes'),
      );
      set({ classes: items, classesStatus: 'ok' });
      return items;
    } catch (err) {
      set({ classes: null, classesStatus: failure(err) });
      return null;
    }
  },

  loadBoard: async (classId) => {
    set({ board: null, boardStatus: 'loading' });
    try {
      const board = learnRankingSchema.parse(
        await apiRequest<unknown>(`/learn/ranking/${encodeURIComponent(classId)}`),
      );
      set({ board, boardStatus: 'ok' });
    } catch (err) {
      set({ board: null, boardStatus: failure(err) });
    }
  },

  loadTable: async (classId) => {
    set({ table: null, tableStatus: 'loading', details: {} });
    try {
      const table = classRankingSchema.parse(
        await apiRequest<unknown>(`/classes/${encodeURIComponent(classId)}/ranking`),
      );
      set({ table, tableStatus: 'ok' });
    } catch (err) {
      set({ table: null, tableStatus: failure(err) });
    }
  },

  loadDetail: async (classId, studentId) => {
    set((s) => ({ details: { ...s.details, [studentId]: { status: 'loading', data: null } } }));
    try {
      const data = studentBreakdownSchema.parse(
        await apiRequest<unknown>(
          `/classes/${encodeURIComponent(classId)}/ranking/${encodeURIComponent(studentId)}`,
        ),
      );
      set((s) => ({ details: { ...s.details, [studentId]: { status: 'ok', data } } }));
    } catch (err) {
      set((s) => ({
        details: { ...s.details, [studentId]: { status: failure(err), data: null } },
      }));
    }
  },
}));
