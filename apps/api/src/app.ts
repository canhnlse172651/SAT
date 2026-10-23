import { existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ApiExceptionFilter } from './errors.js';

export interface HttpOptions {
  /** Built SPA to serve from `/` (production single-container deploy). */
  webDistDir?: string | undefined;
}

/** The HTTP pipeline, shared by `main.ts` and the tests. Call before `app.init()` / `app.listen()`. */
export function configureApp(app: NestExpressApplication, { webDistDir }: HttpOptions = {}): void {
  app.useLogger(app.get(Logger));
  app.disable('x-powered-by');
  app.use(helmet());
  app.useBodyParser('json', { limit: '100kb' });
  // Feature modules are registered in AppModule; their controllers are served under /api/<resource>.
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiExceptionFilter());

  if (webDistDir && existsSync(join(webDistDir, 'index.html'))) {
    serveSpa(app, resolve(webDistDir));
  }
}

function serveSpa(app: NestExpressApplication, root: string): void {
  app.use(
    express.static(root, {
      index: false,
      setHeaders: (res, path) => {
        // Vite fingerprints everything under assets/, so it can be cached forever.
        if (path.includes(`${sep}assets${sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // SPA fallback: client-side routes resolve to index.html; /api stays with Nest (JSON 404s).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path === '/api' || req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(root, 'index.html'));
  });
}
