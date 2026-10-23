import { vi } from 'vitest';

export interface StubReply {
  status?: number;
  body?: unknown;
}
export type StubRoute = StubReply | ((init: RequestInit | undefined) => StubReply);

/**
 * Stubs global fetch. Keys are "METHOD /api/path" (e.g. "GET /api/session"); an unmatched request
 * answers 404 with the API error body so a missing stub is visible in the test output.
 */
export function stubFetch(routes: Record<string, StubRoute>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = `${method} ${String(input)}`;
    const route = routes[key];
    const reply: StubReply = route
      ? typeof route === 'function'
        ? route(init)
        : route
      : {
          status: 404,
          body: { error: { code: 'NOT_FOUND', message: `No stub for ${key}`, requestId: 'stub' } },
        };
    // A fresh Response per call: a body stream can only be read once.
    return new Response(JSON.stringify(reply.body ?? {}), {
      status: reply.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const unauthenticated: StubReply = {
  status: 401,
  body: { error: { code: 'UNAUTHENTICATED', message: 'Chưa đăng nhập', requestId: 'stub' } },
};
