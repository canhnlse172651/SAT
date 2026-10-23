import {
  type Classmate,
  type LessonUnit,
  type MyClassCard,
  type MyClassPage,
  classmatesResponseSchema,
  lessonUnitSchema,
  myClassPageSchema,
  myClassesResponseSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';
import type { LoadStatus } from './classes-store';

interface MyClassesState {
  /* S01 */
  listStatus: LoadStatus;
  classes: MyClassCard[];
  /* S02 */
  pageStatus: LoadStatus;
  page: MyClassPage | null;
  /** The refusal of the last S02 / S11 / members load (shown or redirected by the page). */
  error: unknown;
  membersStatus: LoadStatus;
  members: Classmate[];
  /* S11 */
  unitStatus: LoadStatus;
  unit: LessonUnit | null;

  loadClasses: () => Promise<void>;
  loadPage: (classId: string) => Promise<void>;
  loadMembers: (classId: string) => Promise<void>;
  loadUnit: (classId: string, lessonId: string) => Promise<void>;
}

/** S01, S02 and S11 of module 003. */
export const useMyClassesStore = create<MyClassesState>()((set) => ({
  listStatus: 'idle',
  classes: [],
  pageStatus: 'idle',
  page: null,
  error: null,
  membersStatus: 'idle',
  members: [],
  unitStatus: 'idle',
  unit: null,

  loadClasses: async () => {
    set({ listStatus: 'loading' });
    try {
      const res = myClassesResponseSchema.parse(await apiRequest<unknown>('/my-classes'));
      set({ listStatus: 'ok', classes: res.items });
    } catch {
      set({ listStatus: 'error' });
    }
  },
  loadPage: async (classId) => {
    set((s) => ({
      pageStatus: 'loading',
      error: null,
      ...(s.page?.id !== classId ? { page: null, members: [], membersStatus: 'idle' } : {}),
    }));
    try {
      const page = myClassPageSchema.parse(await apiRequest<unknown>(`/my-classes/${classId}`));
      set({ pageStatus: 'ok', page });
    } catch (error) {
      set({ pageStatus: 'error', error });
    }
  },
  loadMembers: async (classId) => {
    set({ membersStatus: 'loading', error: null });
    try {
      const res = classmatesResponseSchema.parse(
        await apiRequest<unknown>(`/my-classes/${classId}/members`),
      );
      set({ membersStatus: 'ok', members: res.items });
    } catch (error) {
      set({ membersStatus: 'error', error });
    }
  },
  loadUnit: async (classId, lessonId) => {
    set((s) => ({
      unitStatus: 'loading',
      error: null,
      ...(s.unit?.lesson.id !== lessonId || s.unit.classId !== classId ? { unit: null } : {}),
    }));
    try {
      const unit = lessonUnitSchema.parse(
        await apiRequest<unknown>(`/my-classes/${classId}/lessons/${lessonId}`),
      );
      set({ unitStatus: 'ok', unit });
    } catch (error) {
      set({ unitStatus: 'error', error });
    }
  },
}));
