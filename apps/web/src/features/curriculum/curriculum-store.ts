import {
  type CurriculumBody,
  type CurriculumDetail,
  type CurriculumListResponse,
  type CurriculumPatch,
  HSK_LEVELS,
  type HskLevel,
  type Lesson,
  type UsingClass,
  copyNameResponseSchema,
  coverUploadResponseSchema,
  curriculumDetailSchema,
  curriculumListResponseSchema,
  lessonSchema,
  usingClassesResponseSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';
import { readPref, writePref } from './session-prefs';

export type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';
export type LevelFilter = 'all' | `${HskLevel}`;
const LEVEL_FILTERS: readonly LevelFilter[] = ['all', ...HSK_LEVELS.map((l) => `${l}` as const)];

const json = (method: string, body?: unknown) => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

interface CurriculumState {
  /* T05 */
  listStatus: LoadStatus;
  list: CurriculumListResponse | null;
  level: LevelFilter;
  q: string;
  archived: boolean;
  page: number;
  /* T06 */
  detailStatus: LoadStatus;
  detail: CurriculumDetail | null;
  /* T18 / T21 */
  lessonStatus: LoadStatus;
  lesson: Lesson | null;

  loadList: () => Promise<void>;
  setLevel: (level: LevelFilter) => void;
  setQuery: (q: string) => void;
  setArchived: (archived: boolean) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;

  uploadCover: (file: File) => Promise<{ fileId: string; url: string }>;
  create: (body: CurriculumBody) => Promise<CurriculumDetail>;
  update: (id: string, patch: CurriculumPatch) => Promise<CurriculumDetail>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  copyName: (id: string) => Promise<{ name: string; hsk: HskLevel }>;
  duplicate: (id: string, body: { name: string; hsk: HskLevel }) => Promise<CurriculumDetail>;
  classes: (id: string) => Promise<UsingClass[]>;

  loadDetail: (id: string) => Promise<void>;
  /** Shows the new order at once; puts the old one back if saving fails (AC-6.1, AC-6.4). */
  reorder: (id: string, order: string[]) => Promise<void>;
  addLesson: (curriculumId: string, name: string) => Promise<Lesson>;

  loadLesson: (id: string) => Promise<void>;
  /** The saved Bài without touching the screen state (publish dialog on T06). */
  fetchLesson: (id: string) => Promise<Lesson>;
  renameLesson: (id: string, version: number, name: string) => Promise<Lesson>;
  publishLesson: (id: string, version: number, itemIds: string[]) => Promise<Lesson>;
  duplicateLesson: (id: string) => Promise<Lesson>;
  removeLesson: (id: string) => Promise<void>;
}

/** T05, T06, T18 and T21 of module 002. */
export const useCurriculumStore = create<CurriculumState>()((set, get) => ({
  listStatus: 'idle',
  list: null,
  level: readPref('curricula.level', LEVEL_FILTERS, 'all'),
  q: '',
  archived: false,
  page: 1,
  detailStatus: 'idle',
  detail: null,
  lessonStatus: 'idle',
  lesson: null,

  loadList: async () => {
    const { level, q, archived, page } = get();
    set({ listStatus: 'loading' });
    const params = new URLSearchParams({ page: String(page), archived: String(archived) });
    if (level !== 'all') params.set('hsk', level);
    if (q.trim()) params.set('q', q.trim());
    try {
      const list = curriculumListResponseSchema.parse(
        await apiRequest<unknown>(`/curricula?${params.toString()}`),
      );
      if (!list.items.length && page > 1 && list.total > 0) {
        set({ page: 1 });
        return get().loadList();
      }
      set({ listStatus: 'ok', list });
    } catch {
      set({ listStatus: 'error' });
    }
  },
  setLevel: (level) => {
    writePref('curricula.level', level);
    set({ level, page: 1 });
  },
  setQuery: (q) => set({ q, page: 1 }),
  setArchived: (archived) => set({ archived, page: 1 }),
  setPage: (page) => set({ page }),
  clearFilters: () => {
    writePref('curricula.level', 'all');
    set({ level: 'all', q: '', page: 1 });
  },

  uploadCover: async (file) => {
    const res = await apiRequest<unknown>('/curricula/covers', {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    return coverUploadResponseSchema.parse(res);
  },
  create: async (body) =>
    curriculumDetailSchema.parse(await apiRequest<unknown>('/curricula', json('POST', body))),
  update: async (id, patch) => {
    const detail = curriculumDetailSchema.parse(
      await apiRequest<unknown>(`/curricula/${id}`, json('PATCH', patch)),
    );
    set({ detail });
    return detail;
  },
  archive: async (id) => {
    const detail = curriculumDetailSchema.parse(
      await apiRequest<unknown>(`/curricula/${id}/archive`, json('POST')),
    );
    if (get().detail?.id === id) set({ detail });
  },
  restore: async (id) => {
    const detail = curriculumDetailSchema.parse(
      await apiRequest<unknown>(`/curricula/${id}/restore`, json('POST')),
    );
    if (get().detail?.id === id) set({ detail });
  },
  remove: async (id) => {
    await apiRequest<unknown>(`/curricula/${id}`, json('DELETE'));
    if (get().detail?.id === id) set({ detail: null, detailStatus: 'idle' });
  },
  copyName: async (id) =>
    copyNameResponseSchema.parse(await apiRequest<unknown>(`/curricula/${id}/copy-name`)),
  duplicate: async (id, body) =>
    curriculumDetailSchema.parse(
      await apiRequest<unknown>(`/curricula/${id}/duplicate`, json('POST', body)),
    ),
  classes: async (id) =>
    usingClassesResponseSchema.parse(await apiRequest<unknown>(`/curricula/${id}/classes`)).items,

  loadDetail: async (id) => {
    if (get().detail?.id !== id) set({ detail: null });
    set({ detailStatus: 'loading' });
    try {
      const detail = curriculumDetailSchema.parse(await apiRequest<unknown>(`/curricula/${id}`));
      set({ detailStatus: 'ok', detail });
    } catch (err) {
      set({ detailStatus: 'error' });
      throw err;
    }
  },
  reorder: async (id, order) => {
    const before = get().detail;
    if (!before) return;
    const byId = new Map(before.lessons.map((l) => [l.id, l]));
    set({
      detail: {
        ...before,
        lessons: order.map((x) => byId.get(x)).filter((l) => l !== undefined),
      },
    });
    try {
      const detail = curriculumDetailSchema.parse(
        await apiRequest<unknown>(
          `/curricula/${id}/lesson-order`,
          json('PUT', { expectedOrder: before.lessons.map((l) => l.id), order }),
        ),
      );
      set({ detail });
    } catch (err) {
      set({ detail: before });
      throw err;
    }
  },
  addLesson: async (curriculumId, name) =>
    lessonSchema.parse(
      await apiRequest<unknown>(`/curricula/${curriculumId}/lessons`, json('POST', { name })),
    ),

  loadLesson: async (id) => {
    if (get().lesson?.id !== id) set({ lesson: null });
    set({ lessonStatus: 'loading' });
    try {
      const lesson = lessonSchema.parse(await apiRequest<unknown>(`/lessons/${id}`));
      set({ lessonStatus: 'ok', lesson });
    } catch (err) {
      set({ lessonStatus: 'error' });
      throw err;
    }
  },
  fetchLesson: async (id) => lessonSchema.parse(await apiRequest<unknown>(`/lessons/${id}`)),
  renameLesson: async (id, version, name) => {
    const lesson = lessonSchema.parse(
      await apiRequest<unknown>(
        `/lessons/${id}`,
        json('PATCH', { expectedVersion: version, name }),
      ),
    );
    if (get().lesson?.id === id) set({ lesson });
    return lesson;
  },
  publishLesson: async (id, version, itemIds) => {
    const lesson = lessonSchema.parse(
      await apiRequest<unknown>(
        `/lessons/${id}/publish`,
        json('POST', { expectedVersion: version, itemIds }),
      ),
    );
    if (get().lesson?.id === id) set({ lesson });
    return lesson;
  },
  duplicateLesson: async (id) =>
    lessonSchema.parse(await apiRequest<unknown>(`/lessons/${id}/duplicate`, json('POST'))),
  removeLesson: async (id) => {
    await apiRequest<unknown>(`/lessons/${id}`, json('DELETE'));
    if (get().lesson?.id === id) set({ lesson: null, lessonStatus: 'idle' });
  },
}));
