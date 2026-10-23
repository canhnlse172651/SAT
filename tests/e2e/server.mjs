// Hermetic e2e backend: an in-memory MongoDB plus the production build (the API also serves the SPA).
// NODE_ENV=test (not production): ADR-0008 forbids production with dev adapters, and the dev-only
// /api/dev/* endpoints (session, outbox) the e2e tests use exist only in development and test.
const port = process.env.PORT ?? '4173';
import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
const api = spawn(process.execPath, ['--enable-source-maps', 'apps/api/dist/main.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: port,
    // Same origin as Playwright's baseURL, so writes pass the Origin check (send an Origin header).
    APP_ORIGIN: `http://127.0.0.1:${port}`,
    MONGODB_URI: mongo.getUri('sat-e2e'),
    WEB_DIST_DIR: 'apps/web/dist',
    LOG_LEVEL: 'warn',
  },
});

const stop = (code) => {
  api.kill('SIGTERM');
  mongo.stop().finally(() => process.exit(code));
};
api.on('exit', (code) => stop(code ?? 1));
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
