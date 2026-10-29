import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule, type AuthConfig } from './common/auth/auth.module.js';
import { ContextModule } from './common/context/context.module.js';
import { devModules } from './common/dev/dev.module.js';
import { PortsModule, assertNoDevAdaptersInProduction } from './common/ports/index.js';
import { TenancyModule } from './common/tenancy/tenancy.module.js';
import type { Config } from './config.js';
import { DatabaseModule } from './database.module.js';
import { loggerParams } from './logger.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { ClassesModule } from './modules/classes/classes.module.js';
import { CurriculumModule } from './modules/curriculum/curriculum.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SessionModule } from './modules/session/session.module.js';
import { StepsModule } from './modules/steps/steps.module.js';
import { ExercisesModule } from './modules/exercises/exercises.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { ScoringModule } from './modules/scoring/scoring.module.js';

export type AppConfig = Pick<
  Config,
  | 'MONGODB_URI'
  | 'LOG_LEVEL'
  | 'UPLOADS_DIR'
  | 'UPLOAD_MAX_BYTES'
  | 'DEV_EMAIL_DELAY_MS'
  | 'APP_ORIGIN'
> &
  AuthConfig;

/** Composition root. Feature modules are registered in `imports`. */
@Module({})
export class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    assertNoDevAdaptersInProduction(config.NODE_ENV);
    const devHelpers = config.NODE_ENV === 'development' || config.NODE_ENV === 'test';
    const curriculum = CurriculumModule.forRoot({ devHelpers });
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot(loggerParams(config.LOG_LEVEL)),
        ContextModule,
        DatabaseModule.forRoot(config.MONGODB_URI),
        // Dev adapters (outbox, disk, system clock) in development and in the hermetic e2e (NODE_ENV=test).
        PortsModule.forRoot({
          mode: 'dev',
          uploadsDir: config.UPLOADS_DIR,
          storage: { maxBytes: config.UPLOAD_MAX_BYTES },
          devEmail: { delayMs: config.DEV_EMAIL_DELAY_MS },
        }),
        TenancyModule,
        AuthModule.forRoot(config),
        AccountsModule.forRoot({ appOrigin: config.APP_ORIGIN }),
        curriculum,
        ClassesModule.forRoot({ curriculum, appOrigin: config.APP_ORIGIN, devHelpers }),
        StepsModule.forRoot({ curriculum, devHelpers }),
        ExercisesModule.forRoot({ curriculum, devHelpers }),
        ExamsModule.forRoot({ devHelpers }),
        ScoringModule.forRoot({ curriculum }),
        HealthModule,
        SessionModule,
        FilesModule,
        ...devModules(config.NODE_ENV),
      ],
    };
  }
}
