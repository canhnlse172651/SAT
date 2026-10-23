import { AsyncLocalStorage } from 'node:async_hooks';
import type { IncomingMessage } from 'node:http';
import type { Role } from '@sat/shared';

/** Per-request facts available anywhere in the call chain (ADR-0006). `AuthGuard` fills the user fields. */
export interface RequestContext {
  requestId: string;
  userId?: string;
  role?: Role;
  workspaceId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();
// pino-http logs "request completed" from a socket event where AsyncLocalStorage is not reliable,
// so the context is also reachable from the request object itself.
const byRequest = new WeakMap<IncomingMessage, RequestContext>();

/** Runs `fn` inside a fresh context. Used by the middleware, and by jobs/scripts/tests outside HTTP. */
export function runWithContext<T>(context: RequestContext, fn: () => T, req?: IncomingMessage): T {
  if (req) byRequest.set(req, context);
  return storage.run(context, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function contextOf(req: IncomingMessage): RequestContext | undefined {
  return byRequest.get(req);
}

/** Like `getContext` but fails loudly when called outside a request. */
export function requireContext(): RequestContext {
  const context = storage.getStore();
  if (!context) throw new Error('No request context: called outside a request');
  return context;
}
