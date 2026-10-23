import {
  type DynamicModule,
  Global,
  Inject,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import type { Config } from '../../config.js';
import { AuthGuard } from './auth.guard.js';
import { AUTH_OPTIONS, type AuthOptions } from './auth.types.js';
import { isCookieSecure } from './cookie.js';
import { allowedOrigins, originCheck } from './origin-check.js';
import { SESSION_MODEL, sessionSchema } from './session.model.js';
import { SessionService } from './session.service.js';

export type AuthConfig = Pick<
  Config,
  | 'NODE_ENV'
  | 'PORT'
  | 'APP_ORIGIN'
  | 'COOKIE_SECURE'
  | 'SESSION_TTL_GV_HOURS'
  | 'SESSION_TTL_HV_DAYS'
>;

/** Sessions, the global `AuthGuard` and the Origin check. Module 001 provides `SESSION_PRINCIPAL_RESOLVER`. Needs the global PortsModule (CLOCK). */
@Global()
@Module({})
export class AuthModule implements NestModule {
  constructor(@Inject(AUTH_OPTIONS) private readonly options: AuthOptions) {}

  static forRoot(config: AuthConfig): DynamicModule {
    const options: AuthOptions = {
      sessionTtlGvHours: config.SESSION_TTL_GV_HOURS,
      sessionTtlHvDays: config.SESSION_TTL_HV_DAYS,
      cookieSecure: isCookieSecure(config),
      allowedOrigins: allowedOrigins(config),
    };
    return {
      module: AuthModule,
      imports: [MongooseModule.forFeature([{ name: SESSION_MODEL, schema: sessionSchema }])],
      providers: [
        { provide: AUTH_OPTIONS, useValue: options },
        SessionService,
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
      exports: [SessionService, AUTH_OPTIONS],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(originCheck(this.options.allowedOrigins)).forRoutes('{*splat}');
  }
}
