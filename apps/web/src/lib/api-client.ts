import {
  apiErrorSchema,
  ERROR_CODES,
  type SessionFailureReason,
  sessionFailureReasonSchema,
} from '@sat/shared';

/** Mirrors the API error contract: { error: { code, message, details?, requestId } }. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    /** `error.details`: field issues of a 400, `{ reason }` of a 401, module-specific data otherwise. */
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestInit extends RequestInit {
  /** Set to false for calls where a 401 is an expected answer (e.g. loading the session). */
  handleUnauthorized?: boolean;
}

type UnauthorizedHandler = (error: ApiError) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registers the app-level reaction to a 401 (clear session + navigate); returns an unregister fn. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

/** `details.reason` of a 401 (ADR-0005), when present. */
export function sessionFailureReason(error: unknown): SessionFailureReason | null {
  if (!(error instanceof ApiError) || error.status !== 401) return null;
  const parsed = sessionFailureReasonSchema.safeParse(
    (error.details as { reason?: unknown } | undefined)?.reason,
  );
  return parsed.success ? parsed.data : null;
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { handleUnauthorized = true, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  headers.set('Accept', 'application/json');
  if (fetchInit.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api${path}`, { credentials: 'same-origin', ...fetchInit, headers });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    const err = parsed.success ? parsed.data.error : undefined;
    const error = new ApiError(
      res.status,
      err?.code ?? (res.status === 401 ? ERROR_CODES.UNAUTHENTICATED : 'HTTP_ERROR'),
      err?.message ?? (res.statusText || `HTTP ${res.status}`),
      err?.requestId,
      err?.details,
    );
    if (res.status === 401 && handleUnauthorized) unauthorizedHandler?.(error);
    throw error;
  }
  return body as T;
}

export interface UploadInit {
  headers?: Record<string, string>;
  /** Bytes sent so far (at least once a second while the browser reports progress). */
  onProgress?: (loaded: number, total: number) => void;
  /** Every byte is sent; the server is now checking the file. */
  onSent?: () => void;
  signal?: AbortSignal;
  handleUnauthorized?: boolean;
}

function toApiError(status: number, text: string, statusText: string): ApiError {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const parsed = apiErrorSchema.safeParse(body);
  const err = parsed.success ? parsed.data.error : undefined;
  return new ApiError(
    status,
    err?.code ?? (status === 401 ? ERROR_CODES.UNAUTHENTICATED : 'HTTP_ERROR'),
    err?.message ?? (statusText || `HTTP ${status}`),
    err?.requestId,
    err?.details,
  );
}

/**
 * POSTs raw bytes (`application/octet-stream`) with upload progress — fetch cannot report it. A lost connection is
 * `ApiError(0, 'NETWORK_ERROR')`, a cancelled upload `ApiError(0, 'ABORTED')`.
 */
export function uploadRequest<T>(path: string, body: Blob, init: UploadInit = {}): Promise<T> {
  const { handleUnauthorized = true } = init;
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    for (const [k, v] of Object.entries(init.headers ?? {})) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) init.onProgress?.(e.loaded, e.total);
    };
    xhr.upload.onload = () => init.onSent?.();
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve((xhr.responseText ? JSON.parse(xhr.responseText) : null) as T);
        } catch {
          reject(new ApiError(xhr.status, 'HTTP_ERROR', 'Phản hồi không hợp lệ'));
        }
        return;
      }
      const error = toApiError(xhr.status, xhr.responseText, xhr.statusText);
      if (xhr.status === 401 && handleUnauthorized) unauthorizedHandler?.(error);
      reject(error);
    };
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', 'Mất kết nối'));
    xhr.onabort = () => reject(new ApiError(0, 'ABORTED', 'Đã hủy'));
    if (init.signal) {
      if (init.signal.aborted) {
        xhr.abort();
        return;
      }
      init.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}
