import { apiErrorSchema, ERROR_CODES } from '@sat/shared';

/** Mirrors the API error contract: { error: { code, message, requestId } }. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestInit extends RequestInit {
  /** Set to false for calls where a 401 is an expected answer (e.g. loading the session). */
  handleUnauthorized?: boolean;
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registers the app-level reaction to a 401 (clear session + navigate); returns an unregister fn. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
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
    if (res.status === 401 && handleUnauthorized) unauthorizedHandler?.();
    throw new ApiError(
      res.status,
      err?.code ?? (res.status === 401 ? ERROR_CODES.UNAUTHENTICATED : 'HTTP_ERROR'),
      err?.message ?? (res.statusText || `HTTP ${res.status}`),
      err?.requestId,
    );
  }
  return body as T;
}
