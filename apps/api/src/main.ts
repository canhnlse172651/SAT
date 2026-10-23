import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { pino } from 'pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();

try {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config), {
    bufferLogs: true,
    abortOnError: false,
  });
  configureApp(app, { webDistDir: config.WEB_DIST_DIR });
  // SIGTERM/SIGINT → app.close(): drain HTTP, then disconnect MongoDB. Force-exit if that hangs.
  app.enableShutdownHooks();
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => setTimeout(() => process.exit(1), 10_000).unref());
  }
  await app.listen(config.PORT);
  app.get(Logger).log({ port: config.PORT, env: config.NODE_ENV }, 'api listening');
} catch (err) {
  // Fail fast (e.g. MongoDB unreachable at boot): exit and let the platform restart the instance.
  pino({ level: config.LOG_LEVEL }).fatal({ err }, 'cannot start api');
  process.exit(1);
}
