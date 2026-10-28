import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ApiExceptionFilter } from './errors.js';

export interface HttpOptions {
  /** Built SPA to serve from `/` (production single-container deploy). */
  webDistDir?: string | undefined;
}

const LARGE_BODY_PATHS = ['/api/lessons', '/api/dev/curriculum'];

/** The HTTP pipeline, shared by `main.ts` and the tests. Call before `app.init()` / `app.listen()`. */
export function configureApp(app: NestExpressApplication, { webDistDir }: HttpOptions = {}): void {
  app.useLogger(app.get(Logger));
  app.disable('x-powered-by');
  // 004 AC-18.1: lesson videos may be YouTube embeds (privacy-enhanced domain only).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { 'frame-src': ["'self'", 'https://www.youtube-nocookie.com'] },
      },
    }),
  );
  // 005 NFR-11: lesson content (an exercise set of 100 reading questions, AI approval) can be megabytes; the parser
  // that runs first owns the body, so these paths get a larger limit and everything else keeps 100 kB.
  app.use(LARGE_BODY_PATHS, express.json({ limit: '8mb' }));
  app.useBodyParser('json', { limit: '100kb' });
  // Feature modules are registered in AppModule; their controllers are served under /api/<resource>.
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiExceptionFilter());

  if (webDistDir && existsSync(join(webDistDir, 'index.html'))) {
    serveSpa(app, resolve(webDistDir));
  }
}

/** Text assets sent gzip-compressed (images, fonts and video are compressed already). */
const PACKED_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};
const IMMUTABLE = 'public, max-age=31536000, immutable';

/**
 * Fingerprinted scripts and styles gzip-compressed once, then kept in memory: the app's first load on a phone network
 * carries a third of the bytes (004 NFR-1). Anything else — or a client without gzip — goes to `express.static`.
 */
function packedAssets(root: string) {
  const assets = join(root, 'assets');
  const packed = new Map<string, Buffer>();
  return (req: Request, res: Response, next: NextFunction) => {
    const type = PACKED_TYPES[extname(req.path)];
    const accepts = /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !type || !accepts) return next();
    let file: string;
    try {
      file = resolve(assets, `.${decodeURIComponent(req.path)}`);
    } catch {
      return next();
    }
    if (!file.startsWith(assets + sep)) return next();
    let body = packed.get(file);
    if (!body) {
      if (!existsSync(file) || !statSync(file).isFile()) return next();
      body = gzipSync(readFileSync(file), { level: 9 });
      packed.set(file, body);
    }
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Cache-Control', IMMUTABLE);
    res.setHeader('Content-Length', body.length);
    res.end(req.method === 'HEAD' ? undefined : body);
  };
}

function serveSpa(app: NestExpressApplication, root: string): void {
  app.use('/assets', packedAssets(root));
  app.use(
    express.static(root, {
      index: false,
      setHeaders: (res, path) => {
        // Vite fingerprints everything under assets/, so it can be cached forever.
        if (path.includes(`${sep}assets${sep}`)) {
          res.setHeader('Cache-Control', IMMUTABLE);
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
