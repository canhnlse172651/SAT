import {
  type DynamicModule,
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import express from 'express';
import { IMPORT_MAX_BYTES } from '@sat/shared';
import { MongooseModule } from '@nestjs/mongoose';
import { SESSION_PRINCIPAL_RESOLVER } from '../../common/auth/auth.types.js';
import { WORKSPACE_DIRECTORY } from '../../common/directory/workspace-directory.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';
import { ACCOUNT_EMAIL_MODEL, accountEmailSchema } from './account-email.model.js';
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
import {
  STUDENT_IMPORT_MODEL,
  StudentImportService,
  studentImportSchema,
} from './student-import.service.js';
import { NoStudentLinks, STUDENT_LINKS } from './student-links.js';
import { StudentMailService } from './student-mail.service.js';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { THROTTLE_MODEL, ThrottleService, throttleSchema } from './throttle.service.js';

/**
 * Module 001 — accounts and authentication. Global because it owns users and workspaces: it binds the
 * foundation ports `WORKSPACE_DIRECTORY` and `SESSION_PRINCIPAL_RESOLVER` (checked on every request).
 */
@Global()
@Module({})
export class AccountsModule implements NestModule {
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
          { name: ACCOUNT_EMAIL_MODEL, schema: accountEmailSchema },
          { name: STUDENT_IMPORT_MODEL, schema: studentImportSchema },
        ]),
      ],
      controllers: [AuthController, AccountController, StudentsController],
      providers: [
        { provide: ACCOUNTS_OPTIONS, useValue: options },
        AccountsDirectory,
        { provide: WORKSPACE_DIRECTORY, useExisting: AccountsDirectory },
        { provide: SESSION_PRINCIPAL_RESOLVER, useExisting: AccountsDirectory },
        ThrottleService,
        AuditService,
        AuthService,
        AccountService,
        PasswordResetService,
        StudentMailService,
        StudentsService,
        StudentImportService,
        // 003, 005 and 012–015 re-bind this when they exist (student-links.ts).
        { provide: STUDENT_LINKS, useClass: NoStudentLinks },
      ],
      exports: [WORKSPACE_DIRECTORY, SESSION_PRINCIPAL_RESOLVER, STUDENT_LINKS],
    };
  }

  /** The import upload is the raw .xlsx (≤ 2 MB is checked by the service; larger bodies are 413). */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(express.raw({ type: () => true, limit: IMPORT_MAX_BYTES + 512 * 1024 }))
      .forRoutes({ path: 'students/imports', method: RequestMethod.POST });
  }
}
