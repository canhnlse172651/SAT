import {
  type Item,
  type Lesson,
  type Section,
  addItemResponseSchema,
  lessonSchema,
  moveItemResponseSchema,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';
import type { LoadStatus } from './curriculum-store';

/** An item's unsaved title + content (004 / 005 editors write here too). */
export interface WorkingCopy {
  title: string;
  content: unknown;
}

interface EditorState {
  status: LoadStatus;
  lesson: Lesson | null;
  /** Unsaved working copies by item id — kept when switching tabs (AC-7.12). */
  drafts: Record<string, WorkingCopy>;
  showArchived: Record<Section, boolean>;

  load: (lessonId: string) => Promise<void>;
  edit: (itemId: string, copy: WorkingCopy) => void;
  discardAll: () => void;
  setShowArchived: (section: Section, show: boolean) => void;

  addItem: (section: Section, afterItemId?: string) => Promise<string>;
  /** 005 AC-18.5 "Nhân bản" of a set: the copy's id. */
  duplicate: (itemId: string) => Promise<string>;
  move: (itemId: string, direction: 'up' | 'down') => Promise<{ position: number; total: number }>;
  /** `confirmRegrade`: the GV chose "Chấm lại và lưu" (005 AC-19.2). */
  save: (itemId: string, opts?: { confirmRegrade?: boolean }) => Promise<void>;
  /** AC-2.3 "Ghi đè bằng bản của tôi": saves the working copy over the version saved elsewhere. */
  overwrite: (itemId: string, currentVersion: number) => Promise<void>;
  /** AC-2.3 "Tải lại bản mới nhất": the latest saved item replaces this item's working copy only. */
  reloadItem: (itemId: string) => Promise<void>;
  /** AC-19.5: drops the unsaved edits of one section (its items were replaced). */
  discardSection: (section: Section) => void;
  publish: (itemId: string) => Promise<void>;
  setArchived: (itemId: string, archived: boolean) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
}

const json = (method: string, body?: unknown) => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const same = (a: WorkingCopy, b: Item) =>
  a.title === b.title && JSON.stringify(a.content) === JSON.stringify(b.content);

/** Unsaved items of the Bài, for the leave warning (AC-7.13) and the tab labels. */
export const unsavedIds = (
  s: Pick<EditorState, 'drafts' | 'lesson'>,
  section?: Section,
): string[] =>
  Object.keys(s.drafts).filter(
    (id) => !section || s.lesson?.items.find((i) => i.id === id)?.section === section,
  );

/** The item as the GV currently sees it (working copy over the saved one). */
export const workingItem = (item: Item, drafts: Record<string, WorkingCopy>): Item => {
  const d = drafts[item.id];
  return d ? { ...item, title: d.title, content: d.content } : item;
};

/** T07 "Soạn bài thủ công": every 002 action is saved immediately (AC-7.10); content edits wait for "Lưu". */
export const useLessonEditorStore = create<EditorState>()((set, get) => {
  /** Stores the server's Bài and keeps only working copies of items that still exist and still differ. */
  const apply = (lesson: Lesson, saved?: string) => {
    const drafts: Record<string, WorkingCopy> = {};
    for (const [id, copy] of Object.entries(get().drafts)) {
      const item = lesson.items.find((i) => i.id === id);
      if (item && id !== saved && !same(copy, item)) drafts[id] = copy;
    }
    set({ lesson, drafts, status: 'ok' });
  };
  const call = async (path: string, init: RequestInit, saved?: string) => {
    const id = get().lesson?.id;
    const res = await apiRequest<unknown>(`/lessons/${id}${path}`, init);
    apply(lessonSchema.parse(res), saved);
  };
  const item = (itemId: string) => {
    const it = get().lesson?.items.find((i) => i.id === itemId);
    if (!it) throw new Error('item not loaded');
    return it;
  };
  const bodyOf = (itemId: string) => {
    const it = item(itemId);
    const w = workingItem(it, get().drafts);
    return { expectedVersion: it.version, title: w.title, content: w.content };
  };

  return {
    status: 'idle',
    lesson: null,
    drafts: {},
    showArchived: { lesson: false, exercise: false },

    load: async (lessonId) => {
      if (get().lesson?.id !== lessonId) {
        set({ lesson: null, drafts: {}, showArchived: { lesson: false, exercise: false } });
      }
      set({ status: 'loading' });
      try {
        apply(lessonSchema.parse(await apiRequest<unknown>(`/lessons/${lessonId}`)));
      } catch (err) {
        set({ status: 'error' });
        throw err;
      }
    },
    edit: (itemId, copy) =>
      set((s) => {
        const saved = s.lesson?.items.find((i) => i.id === itemId);
        const drafts = { ...s.drafts };
        if (saved && same(copy, saved)) delete drafts[itemId];
        else drafts[itemId] = copy;
        return { drafts };
      }),
    discardAll: () => set({ drafts: {} }),
    setShowArchived: (section, show) =>
      set((s) => ({ showArchived: { ...s.showArchived, [section]: show } })),

    addItem: async (section, afterItemId) => {
      const id = get().lesson?.id;
      const res = addItemResponseSchema.parse(
        await apiRequest<unknown>(
          `/lessons/${id}/items`,
          json('POST', { section, ...(afterItemId ? { afterItemId } : {}) }),
        ),
      );
      apply(res.lesson);
      return res.itemId;
    },
    duplicate: async (itemId) => {
      const id = get().lesson?.id;
      const res = addItemResponseSchema.parse(
        await apiRequest<unknown>(`/lessons/${id}/items/${itemId}/duplicate`, json('POST')),
      );
      apply(res.lesson);
      return res.itemId;
    },
    move: async (itemId, direction) => {
      const lesson = get().lesson;
      const section = item(itemId).section;
      const expectedOrder = (lesson?.items ?? [])
        .filter((i) => i.section === section)
        .map((i) => i.id);
      const res = moveItemResponseSchema.parse(
        await apiRequest<unknown>(
          `/lessons/${lesson?.id}/items/${itemId}/move`,
          json('POST', { direction, expectedOrder }),
        ),
      );
      apply(res.lesson);
      return { position: res.position, total: res.total };
    },
    save: (itemId, opts) =>
      call(
        `/items/${itemId}`,
        json('PUT', {
          ...bodyOf(itemId),
          ...(opts?.confirmRegrade ? { confirmRegrade: true } : {}),
        }),
        itemId,
      ),
    overwrite: (itemId, currentVersion) =>
      call(
        `/items/${itemId}`,
        json('PUT', { ...bodyOf(itemId), expectedVersion: currentVersion }),
        itemId,
      ),
    reloadItem: async (itemId) => {
      const id = get().lesson?.id;
      apply(lessonSchema.parse(await apiRequest<unknown>(`/lessons/${id}`)), itemId);
    },
    discardSection: (section) =>
      set((s) => ({
        drafts: Object.fromEntries(
          Object.entries(s.drafts).filter(
            ([id]) => s.lesson?.items.find((i) => i.id === id)?.section !== section,
          ),
        ),
      })),
    publish: (itemId) => call(`/items/${itemId}/publish`, json('POST', bodyOf(itemId)), itemId),
    setArchived: (itemId, archived) =>
      call(
        `/items/${itemId}/${archived ? 'archive' : 'restore'}`,
        json('POST', { expectedVersion: item(itemId).version }),
      ),
    remove: (itemId) => call(`/items/${itemId}`, json('DELETE'), itemId),
  };
});
