import { randomUUID } from 'node:crypto';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { runWithContext } from './request-context.js';

/** Opens the request context. Import after the logger module so pino-http's request id exists. */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestId = typeof req.id === 'string' ? req.id : randomUUID();
  runWithContext({ requestId }, next, req);
}

@Module({})
export class ContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestContextMiddleware).forRoutes('{*splat}');
  }
}
