import { FORBIDDEN } from '@sat/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../../errors.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** The origins allowed to send state-changing requests. Dev also allows Vite and the API's own origin. */
export function allowedOrigins(env: {
  NODE_ENV: string;
  APP_ORIGIN: string;
  PORT: number;
}): string[] {
  const origins = [env.APP_ORIGIN];
  if (env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173', `http://localhost:${env.PORT}`);
  }
  return [...new Set(origins)];
}

function originOf(req: Request): string | undefined {
  const origin = req.headers.origin;
  if (typeof origin === 'string') return origin;
  const referer = req.headers.referer;
  if (typeof referer !== 'string') return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/** CSRF defence (ADR-0005): writes under /api must come from an allowed origin. */
export function originCheck(allowed: readonly string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const isApi = req.originalUrl === '/api' || req.originalUrl.startsWith('/api/');
    if (!isApi || !WRITE_METHODS.has(req.method)) return next();
    const origin = originOf(req);
    if (!origin || !allowed.includes(origin)) {
      throw new AppError(403, FORBIDDEN, 'Request origin not allowed');
    }
    next();
  };
}
