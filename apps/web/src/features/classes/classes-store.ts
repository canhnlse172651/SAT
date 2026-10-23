import {
  type ClassContent,
  type ClassDetail,
  type ClassFilter,
  type ClassListResponse,
  type ClassMember,
  type CreateClassBody,
  type CurriculumOption,
  type DeadlineBody,
  type PatchClassBody,
  type StudentOptionsResponse,
  type VisibilityBody,
  addStudentsResponseSchema,
  classContentSchema,
  classDetailSchema,
  classListResponseSchema,
  classMembersResponseSchema,
  contentChangeResponseSchema,
  curriculumOptionsResponseSchema,
  studentOptionsResponseSchema,
  visibilityPreviewSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';

export type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';

const json = (method: string, body?: unknown) => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

interface ClassesState {
  /* T02 */
  listStatus: LoadStatus;
  list: ClassListResponse | null;
  filter: ClassFilter;
  q: string;
  page: number;
  /* T04 */
  detailStatus: LoadStatus;
  detail: ClassDetail | null;
  membersStatus: LoadStatus;
  members: ClassMember[];
  contentStatus: LoadStatus;
  content: ClassContent | null;

  loadList: () => Promise<void>;
  setFilter: (filter: ClassFilter) => void;
  setQuery: (q: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;

  /* wizard and dialogs */
  nameAvailable: (name: string, excludeId?: string) => Promise<boolean>;
  studentOptions: (q: string, page: number, classId?: string) => Promise<StudentOptionsResponse>;
  curriculumOptions: () => Promise<CurriculumOption[]>;
  create: (body: CreateClassBody) => Promise<ClassDetail>;

  loadDetail: (id: string) => Promise<void>;
  update: (id: string, patch: PatchClassBody) => Promise<ClassDetail>;
  changeCurriculum: (id: string, curriculumId: string) => Promise<ClassDetail>;
  end: (id: string) => Promise<ClassDetail>;
  reopen: (id: string) => Promise<ClassDetail>;
  remove: (id: string) => Promise<void>;

  loadMembers: (id: string) => Promise<void>;
  addStudents: (id: string, studentIds: string[]) => Promise<number>;
  removeStudent: (id: string, studentId: string) => Promise<void>;

  loadContent: (id: string) => Promise<void>;
  /** Replaces the tab with the server's state (after a refusal that carries it — AC-16.6). */
  setContent: (content: ClassContent) => void;
  visibilityPreview: (
    id: string,
    body: VisibilityBody,
  ) => Promise<{ changes: number; inProgress: number }>;
  setVisibility: (id: string, body: VisibilityBody) => Promise<number>;
  setDeadlines: (id: string, body: DeadlineBody) => Promise<number>;
}

/** T02, T03 data and T04 of module 003. */
export const useClassesStore = create<ClassesState>()((set, get) => ({
  listStatus: 'idle',
  list: null,
  filter: 'live',
  q: '',
  page: 1,
  detailStatus: 'idle',
  detail: null,
  membersStatus: 'idle',
  members: [],
  contentStatus: 'idle',
  content: null,

  loadList: async () => {
    const { filter, q, page } = get();
    set({ listStatus: 'loading' });
    const params = new URLSearchParams({ status: filter, page: String(page) });
    if (q.trim()) params.set('q', q.trim());
    try {
      const list = classListResponseSchema.parse(
        await apiRequest<unknown>(`/classes?${params.toString()}`),
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
  setFilter: (filter) => set({ filter, page: 1 }),
  setQuery: (q) => set({ q, page: 1 }),
  setPage: (page) => set({ page }),
  clearFilters: () => set({ filter: 'live', q: '', page: 1 }),

  nameAvailable: async (name, excludeId) => {
    const params = new URLSearchParams({ name });
    if (excludeId) params.set('excludeId', excludeId);
    const res = await apiRequest<{ available: boolean }>(
      `/classes/name-available?${params.toString()}`,
    );
    return res.available;
  },
  studentOptions: async (q, page, classId) => {
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set('q', q.trim());
    if (classId) params.set('classId', classId);
    return studentOptionsResponseSchema.parse(
      await apiRequest<unknown>(`/classes/student-options?${params.toString()}`),
    );
  },
  curriculumOptions: async () =>
    curriculumOptionsResponseSchema.parse(await apiRequest<unknown>('/classes/curriculum-options'))
      .items,
  create: async (body) =>
    classDetailSchema.parse(await apiRequest<unknown>('/classes', json('POST', body))),

  loadDetail: async (id) => {
    if (get().detail?.id !== id) set({ detail: null, members: [], content: null });
    set({ detailStatus: 'loading' });
    try {
      const detail = classDetailSchema.parse(await apiRequest<unknown>(`/classes/${id}`));
      set({ detailStatus: 'ok', detail });
    } catch (err) {
      set({ detailStatus: 'error' });
      throw err;
    }
  },
  update: async (id, patch) => {
    const detail = classDetailSchema.parse(
      await apiRequest<unknown>(`/classes/${id}`, json('PATCH', patch)),
    );
    set({ detail });
    return detail;
  },
  changeCurriculum: async (id, curriculumId) => {
    const detail = classDetailSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/curriculum`, json('PUT', { curriculumId })),
    );
    set({ detail, content: null });
    return detail;
  },
  end: async (id) => {
    const detail = classDetailSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/end`, json('POST')),
    );
    set({ detail });
    return detail;
  },
  reopen: async (id) => {
    const detail = classDetailSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/reopen`, json('POST')),
    );
    set({ detail });
    return detail;
  },
  remove: async (id) => {
    await apiRequest<unknown>(`/classes/${id}`, json('DELETE'));
    set({ detail: null });
  },

  loadMembers: async (id) => {
    set({ membersStatus: 'loading' });
    try {
      const res = classMembersResponseSchema.parse(
        await apiRequest<unknown>(`/classes/${id}/students`),
      );
      const detail = get().detail;
      set({
        membersStatus: 'ok',
        members: res.items,
        ...(detail ? { detail: { ...detail, memberCount: res.memberCount } } : {}),
      });
    } catch {
      set({ membersStatus: 'error' });
    }
  },
  addStudents: async (id, studentIds) => {
    const res = addStudentsResponseSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/students`, json('POST', { studentIds })),
    );
    await get().loadMembers(id);
    return res.added;
  },
  removeStudent: async (id, studentId) => {
    await apiRequest<unknown>(`/classes/${id}/students/${studentId}`, json('DELETE'));
    await get().loadMembers(id);
  },

  loadContent: async (id) => {
    set({ contentStatus: 'loading' });
    try {
      const content = classContentSchema.parse(await apiRequest<unknown>(`/classes/${id}/content`));
      set({ contentStatus: 'ok', content });
    } catch {
      set({ contentStatus: 'error' });
    }
  },
  setContent: (content) => set({ content }),
  visibilityPreview: async (id, body) =>
    visibilityPreviewSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/visibility/preview`, json('POST', body)),
    ),
  setVisibility: async (id, body) => {
    const res = contentChangeResponseSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/visibility`, json('PUT', body)),
    );
    const detail = get().detail;
    set({
      content: res.content,
      ...(detail ? { detail: { ...detail, hiddenCount: res.content.hiddenCount } } : {}),
    });
    return res.changed;
  },
  setDeadlines: async (id, body) => {
    const res = contentChangeResponseSchema.parse(
      await apiRequest<unknown>(`/classes/${id}/deadlines`, json('PUT', body)),
    );
    set({ content: res.content });
    return res.changed;
  },
}));
