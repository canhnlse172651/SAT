import {
  type FileKind,
  type FileRef,
  STEP_ERROR_CODES,
  type StepsInfo,
  checkFileChoice,
  fileRefSchema,
  stepsInfoSchema,
  storageFullMessage,
  uploadFailedMessage,
} from '@sat/shared';
import { create } from 'zustand';
import { ApiError, apiRequest, uploadRequest } from '../../lib/api-client';

export type UploadPhase = 'uploading' | 'processing' | 'failed';

/** One file upload of a block or card (REQ-6). */
export interface Upload {
  key: string;
  itemId: string;
  kind: FileKind;
  file: File;
  name: string;
  percent: number;
  phase: UploadPhase;
  /** Failure text; `retry` = a lost upload ("Thử lại"), otherwise a refusal of the file. */
  error: string | null;
  retry: boolean;
}

type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';

interface StepEditorState {
  /** T07 side data of the open Bài (AC-5.5, AC-7.4, AC-10.1). */
  info: StepsInfo | null;
  infoStatus: LoadStatus;
  uploads: Record<string, Upload>;

  loadInfo: (lessonId: string) => Promise<void>;
  /** Starts (or restarts) the upload `key`; `onDone` gets the stored file once it is accepted. */
  upload: (
    key: string,
    itemId: string,
    kind: FileKind,
    file: File,
    onDone: (ref: FileRef) => void,
  ) => void;
  /** Shows a refusal on the block without uploading (AC-5.2, AC-5.3, AC-5.6). */
  refuse: (key: string, itemId: string, kind: FileKind, file: File, message: string) => void;
  retry: (key: string) => void;
  cancel: (key: string) => void;
  dismiss: (key: string) => void;
  /** Cancels every upload (leaving T07 — AC-2.2). */
  cancelAll: () => void;
}

/** Aborters and completion callbacks by upload key — not state (functions). */
const running = new Map<string, { abort: AbortController; onDone: (ref: FileRef) => void }>();

const REFUSALS: readonly string[] = [
  STEP_ERROR_CODES.UNSUPPORTED_FORMAT,
  STEP_ERROR_CODES.FILE_TOO_LARGE,
  STEP_ERROR_CODES.CORRUPT_FILE,
  STEP_ERROR_CODES.PROCESS_FAILED,
  STEP_ERROR_CODES.STORAGE_FULL,
];

/** Uploads and side data of the Bài học tab of T07 and the T08 dialog. */
export const useStepEditorStore = create<StepEditorState>()((set, get) => {
  const patch = (key: string, changes: Partial<Upload>) =>
    set((s) => {
      const u = s.uploads[key];
      return u ? { uploads: { ...s.uploads, [key]: { ...u, ...changes } } } : {};
    });
  const drop = (key: string) =>
    set((s) => {
      const uploads = { ...s.uploads };
      delete uploads[key];
      return { uploads };
    });

  const run = (key: string) => {
    const u = get().uploads[key];
    const entry = running.get(key);
    if (!u || !entry) return;
    const abort = new AbortController();
    running.set(key, { ...entry, abort });
    patch(key, { phase: 'uploading', percent: 0, error: null, retry: false });
    let lastTick = 0;
    uploadRequest<unknown>(`/steps/files?kind=${u.kind}`, u.file, {
      headers: { 'X-File-Name': encodeURIComponent(u.name) },
      signal: abort.signal,
      onProgress: (loaded, total) => {
        const now = Date.now();
        // AC-6.1: at least once a second; never more than ~10 times a second.
        if (now - lastTick < 100 && loaded < total) return;
        lastTick = now;
        patch(key, { percent: total ? Math.floor((loaded * 100) / total) : 0 });
      },
      onSent: () => patch(key, { percent: 100, phase: 'processing' }),
    })
      .then((raw) => {
        const ref = fileRefSchema.parse(raw);
        running.get(key)?.onDone(ref);
        running.delete(key);
        drop(key);
        const info = get().info;
        if (info) {
          set({
            info: {
              ...info,
              storage: { ...info.storage, usedBytes: info.storage.usedBytes + ref.size },
            },
          });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.code === 'ABORTED') return;
        if (err instanceof ApiError && REFUSALS.includes(err.code)) {
          patch(key, { phase: 'failed', error: err.message, retry: false });
        } else {
          const reason = err instanceof ApiError && err.status > 0 ? err.message : 'Mất kết nối';
          patch(key, { phase: 'failed', error: uploadFailedMessage(reason), retry: true });
        }
      });
  };

  return {
    info: null,
    infoStatus: 'idle',
    uploads: {},

    loadInfo: async (lessonId) => {
      set({ infoStatus: 'loading' });
      try {
        const info = stepsInfoSchema.parse(
          await apiRequest<unknown>(`/steps/lessons/${lessonId}/info`),
        );
        set({ info, infoStatus: 'ok' });
      } catch {
        set({ infoStatus: 'error' });
      }
    },

    upload: (key, itemId, kind, file, onDone) => {
      running.get(key)?.abort.abort();
      running.set(key, { abort: new AbortController(), onDone });
      set((s) => ({
        uploads: {
          ...s.uploads,
          [key]: {
            key,
            itemId,
            kind,
            file,
            name: file.name,
            percent: 0,
            phase: 'uploading',
            error: null,
            retry: false,
          },
        },
      }));
      run(key);
    },
    refuse: (key, itemId, kind, file, message) => {
      running.get(key)?.abort.abort();
      running.delete(key);
      set((s) => ({
        uploads: {
          ...s.uploads,
          [key]: {
            key,
            itemId,
            kind,
            file,
            name: file.name,
            percent: 0,
            phase: 'failed',
            error: message,
            retry: false,
          },
        },
      }));
    },
    retry: (key) => run(key),
    cancel: (key) => {
      running.get(key)?.abort.abort();
      running.delete(key);
      drop(key);
    },
    dismiss: (key) => {
      running.delete(key);
      drop(key);
    },
    cancelAll: () => {
      for (const { abort } of running.values()) abort.abort();
      running.clear();
      set({ uploads: {} });
    },
  };
});

/** AC-6.4: a step with a file still uploading (block or card) cannot be saved or published. */
export const isUploading = (uploads: Record<string, Upload>, itemId: string): boolean =>
  Object.values(uploads).some((u) => u.itemId === itemId && u.phase !== 'failed');

/**
 * A file chosen for a block or card: refused at once when its format, size or the workspace storage forbids it
 * (AC-5.2, AC-5.3, AC-5.6), otherwise uploaded; `onDone` receives the stored file.
 */
export function chooseFile(
  key: string,
  itemId: string,
  kind: FileKind,
  file: File,
  onDone: (ref: FileRef) => void,
): void {
  const store = useStepEditorStore.getState();
  const refusal = checkFileChoice(kind, file.name, file.size);
  if (refusal) {
    store.refuse(key, itemId, kind, file, refusal);
    return;
  }
  const storage = store.info?.storage;
  if (storage && storage.usedBytes + file.size > storage.quotaBytes) {
    store.refuse(
      key,
      itemId,
      kind,
      file,
      storageFullMessage(storage.quotaBytes - storage.usedBytes),
    );
    return;
  }
  store.upload(key, itemId, kind, file, onDone);
}
