import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SESSION_PRINCIPAL_RESOLVER } from '../../common/auth/auth.types.js';
import { WORKSPACE_DIRECTORY } from '../../common/directory/workspace-directory.js';
import { AccountsDirectory } from './accounts-directory.js';
import { USER_MODEL, WORKSPACE_MODEL, userSchema, workspaceSchema } from './accounts.model.js';
import { ACCOUNTS_OPTIONS, type AccountsOptions } from './accounts.options.js';
import { AUDIT_MODEL, AuditService, auditEventSchema } from './audit.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {
  PASSWORD_RESET_MODEL,
  PasswordResetService,
  passwordResetSchema,
} from './password-reset.service.js';
import { THROTTLE_MODEL, ThrottleService, throttleSchema } from './throttle.service.js';

/**
 * Module 001 — accounts and authentication. Global because it owns users and workspaces: it binds the
 * foundation ports `WORKSPACE_DIRECTORY` and `SESSION_PRINCIPAL_RESOLVER` (checked on every request).
 */
@Global()
@Module({})
export class AccountsModule {
  static forRoot(options: AccountsOptions): DynamicModule {
    return {
      module: AccountsModule,
      imports: [
        MongooseModule.forFeature([
          { name: USER_MODEL, schema: userSchema },
          { name: WORKSPACE_MODEL, schema: workspaceSchema },
          { name: THROTTLE_MODEL, schema: throttleSchema },
          { name: AUDIT_MODEL, schema: auditEventSchema },
          { name: PASSWORD_RESET_MODEL, schema: passwordResetSchema },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: ACCOUNTS_OPTIONS, useValue: options },
        AccountsDirectory,
        { provide: WORKSPACE_DIRECTORY, useExisting: AccountsDirectory },
        { provide: SESSION_PRINCIPAL_RESOLVER, useExisting: AccountsDirectory },
        ThrottleService,
        AuditService,
        AuthService,
        PasswordResetService,
      ],
      exports: [WORKSPACE_DIRECTORY, SESSION_PRINCIPAL_RESOLVER],
    };
  }
}
