import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

/** An expected, client-facing failure. Anything else is reported as a generic 500. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface ErrorBody {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

function toErrorBody(err: unknown): ErrorBody {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: err.issues,
    };
  }
  // Nest's own exceptions (e.g. unknown route → 404) and errors raised by Express middleware
  // such as body-parser (malformed JSON, payload too large) carry a 4xx status.
  const status =
    err instanceof HttpException
      ? err.getStatus()
      : typeof (err as { status?: unknown })?.status === 'number'
        ? (err as { status: number }).status
        : 500;
  if (status < 400 || status >= 500) {
    return { status: 500, code: 'INTERNAL', message: 'Internal server error' };
  }
  return {
    status,
    code: HttpStatus[status] ?? 'BAD_REQUEST',
    message: String((err as Error).message),
  };
}

// Error body contract for every API response: { error: { code, message, details?, requestId } }
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(err: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const { status, ...error } = toErrorBody(err);
    if (status === 500) this.logger.error({ err, requestId: req.id }, 'unhandled error');
    http
      .getResponse<Response>()
      .status(status)
      .json({ error: { ...error, requestId: req.id } });
  }
}
