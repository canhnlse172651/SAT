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
