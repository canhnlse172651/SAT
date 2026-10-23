import {
  type BulkAction,
  type BulkPreview,
  type BulkSelection,
  bulkPreviewResponseSchema,
  emailBatchSchema,
  importReportSchema,
  importResultSchema,
  type ImportReport,
  type ImportResult,
  mailActionResponseSchema,
  type MailActionResponse,
  type MailPreview,
  mailPreviewsResponseSchema,
  type Student,
  type StudentBody,
  type StudentFilter,
  studentListResponseSchema,
  type StudentListResponse,
  studentSchema,
  XLSX_CONTENT_TYPE,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';

export type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';

/** One action whose e-mails T11 follows until each has a result (AC-7.3, AC-18.1). */
export interface TrackedBatch {
  batchId: string;
  /** `single`: toast per student; `bulk`: summary line. */
  scope: 'single' | 'bulk';
  verb: 'Kích hoạt' | 'Gửi lại';
  email?: string;
  mailKind?: 'activation' | 'new_password';
  skipped: number;
}

export interface BatchOutcome {
  batch: TrackedBatch;
  sent: number;
  failed: number;
}

interface StudentsState {
  status: LoadStatus;
  list: StudentListResponse | null;
  q: string;
  filter: StudentFilter;
  page: number;
  selectedIds: string[];
  /** "Chọn tất cả N học viên khớp bộ lọc" (AC-7.2). */
  allMatching: boolean;
  tracking: TrackedBatch[];
  /** Last bulk result line shown on T11. */
  summary: string | null;

  load: () => Promise<void>;
  setQuery: (q: string) => void;
  setFilter: (filter: StudentFilter) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  toggle: (id: string) => void;
  togglePage: () => void;
  selectAllMatching: () => void;
  clearSelection: () => void;
  dismissSummary: () => void;

  create: (body: StudentBody) => Promise<Student>;
  update: (id: string, body: StudentBody) => Promise<Student>;
  remove: (id: string) => Promise<void>;
  lock: (id: string) => Promise<Student>;
  unlock: (id: string) => Promise<Student>;
  mailAction: (student: Student, action: 'activate' | 'resend' | 'reset-password') => Promise<void>;
  bulkPreview: (action: BulkAction) => Promise<BulkPreview>;
  bulkRun: (action: BulkAction) => Promise<void>;
  /** Checks every tracked batch; returns those that finished. */
  poll: () => Promise<BatchOutcome[]>;

  checkImport: (file: File) => Promise<ImportReport>;
  confirmImport: (importId: string) => Promise<ImportResult>;
  mailPreviews: () => Promise<MailPreview[]>;
}

const json = (method: string, body?: unknown) => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** T11 / T12 (REQ-7 … REQ-13, REQ-18). */
export const useStudentsStore = create<StudentsState>()((set, get) => {
  const selection = (): BulkSelection => {
    const s = get();
    return s.allMatching
      ? { filter: { ...(s.q.trim() ? { q: s.q.trim() } : {}), status: s.filter } }
      : { ids: s.selectedIds };
  };
  const track = (batch: TrackedBatch) => set((s) => ({ tracking: [...s.tracking, batch] }));

  return {
    status: 'idle',
    list: null,
    q: '',
    filter: 'all',
    page: 1,
    selectedIds: [],
    allMatching: false,
    tracking: [],
    summary: null,

    load: async () => {
      const { q, filter, page } = get();
      set({ status: 'loading' });
      const params = new URLSearchParams({ status: filter, page: String(page) });
      if (q.trim()) params.set('q', q.trim());
      try {
        const list = studentListResponseSchema.parse(
          await apiRequest<unknown>(`/students?${params.toString()}`),
        );
        // A search that leaves the page empty goes back to page 1.
        if (!list.items.length && page > 1 && list.total > 0) {
          set({ page: 1 });
          return get().load();
        }
        set({ status: 'ok', list });
      } catch {
        set({ status: 'error' });
      }
    },
    setQuery: (q) => set({ q, page: 1, selectedIds: [], allMatching: false }),
    setFilter: (filter) => set({ filter, page: 1, selectedIds: [], allMatching: false }),
    setPage: (page) => set({ page, allMatching: false }),
    clearFilters: () => set({ q: '', filter: 'all', page: 1, selectedIds: [], allMatching: false }),
    toggle: (id) =>
      set((s) => ({
        allMatching: false,
        selectedIds: s.selectedIds.includes(id)
          ? s.selectedIds.filter((x) => x !== id)
          : [...s.selectedIds, id],
      })),
    togglePage: () =>
      set((s) => {
        const ids = s.list?.items.map((i) => i.id) ?? [];
        const all = ids.length > 0 && ids.every((id) => s.selectedIds.includes(id));
        return {
          allMatching: false,
          selectedIds: all
            ? s.selectedIds.filter((id) => !ids.includes(id))
            : [...new Set([...s.selectedIds, ...ids])],
        };
      }),
    selectAllMatching: () => set({ allMatching: true }),
    clearSelection: () => set({ selectedIds: [], allMatching: false }),
    dismissSummary: () => set({ summary: null }),

    create: async (body) =>
      studentSchema.parse(await apiRequest<unknown>('/students', json('POST', body))),
    update: async (id, body) =>
      studentSchema.parse(await apiRequest<unknown>(`/students/${id}`, json('PATCH', body))),
    remove: async (id) => {
      await apiRequest<unknown>(`/students/${id}`, json('DELETE'));
      set((s) => ({ selectedIds: s.selectedIds.filter((x) => x !== id) }));
    },
    lock: async (id) =>
      studentSchema.parse(await apiRequest<unknown>(`/students/${id}/lock`, json('POST'))),
    unlock: async (id) =>
      studentSchema.parse(await apiRequest<unknown>(`/students/${id}/unlock`, json('POST'))),
    mailAction: async (student, action) => {
      const res: MailActionResponse = mailActionResponseSchema.parse(
        await apiRequest<unknown>(`/students/${student.id}/${action}`, json('POST')),
      );
      if (res.batchId) {
        track({
          batchId: res.batchId,
          scope: 'single',
          verb: action === 'activate' ? 'Kích hoạt' : 'Gửi lại',
          email: student.email,
          mailKind:
            action === 'activate'
              ? 'activation'
              : action === 'reset-password'
                ? 'new_password'
                : (student.mailKind ?? 'activation'),
          skipped: 0,
        });
      }
    },
    bulkPreview: async (action) =>
      bulkPreviewResponseSchema.parse(
        await apiRequest<unknown>(
          '/students/bulk/preview',
          json('POST', { action, selection: selection() }),
        ),
      ),
    bulkRun: async (action) => {
      const res = mailActionResponseSchema.parse(
        await apiRequest<unknown>(
          `/students/bulk/${action}`,
          json('POST', { selection: selection() }),
        ),
      );
      set({ selectedIds: [], allMatching: false, summary: null });
      const verb = action === 'activate' ? 'Kích hoạt' : 'Gửi lại';
      if (res.batchId) track({ batchId: res.batchId, scope: 'bulk', verb, skipped: res.skipped });
      else
        set({
          summary: `${verb} xong: 0 đã gửi email, 0 gửi email thất bại, ${res.skipped} bỏ qua.`,
        });
    },
    poll: async () => {
      const done: BatchOutcome[] = [];
      for (const batch of get().tracking) {
        try {
          const b = emailBatchSchema.parse(
            await apiRequest<unknown>(`/students/email-batches/${batch.batchId}`),
          );
          if (b.sending === 0) done.push({ batch, sent: b.sent, failed: b.failed });
        } catch {
          // Batch gone (student deleted): stop following it.
          done.push({ batch, sent: 0, failed: 0 });
        }
      }
      if (done.length) {
        const ids = new Set(done.map((d) => d.batch.batchId));
        const bulk = done.filter((d) => d.batch.scope === 'bulk').at(-1);
        set((s) => ({
          tracking: s.tracking.filter((t) => !ids.has(t.batchId)),
          ...(bulk
            ? {
                summary: `${bulk.batch.verb} xong: ${bulk.sent} đã gửi email, ${bulk.failed} gửi email thất bại, ${bulk.batch.skipped} bỏ qua.`,
              }
            : {}),
        }));
      }
      return done;
    },

    checkImport: async (file) =>
      importReportSchema.parse(
        await apiRequest<unknown>('/students/imports', {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': XLSX_CONTENT_TYPE },
        }),
      ),
    confirmImport: async (importId) =>
      importResultSchema.parse(
        await apiRequest<unknown>(`/students/imports/${importId}/confirm`, json('POST')),
      ),
    mailPreviews: async () =>
      mailPreviewsResponseSchema.parse(await apiRequest<unknown>('/students/email-templates'))
        .templates,
  };
});
