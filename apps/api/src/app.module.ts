import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { Config } from './config.js';
import { DatabaseModule } from './database.module.js';
import { loggerParams } from './logger.js';
import { HealthModule } from './modules/health/health.module.js';

/** Composition root. Feature modules are registered in `imports`. */
@Module({})
export class AppModule {
  static forRoot(config: Pick<Config, 'MONGODB_URI' | 'LOG_LEVEL'>): DynamicModule {
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot(loggerParams(config.LOG_LEVEL)),
        DatabaseModule.forRoot(config.MONGODB_URI),
        HealthModule,
      ],
    };
  }
}
