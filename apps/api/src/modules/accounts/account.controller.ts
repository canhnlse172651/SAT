import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import {
  type AccountResponse,
  changeEmailBodySchema,
  changePasswordBodySchema,
  profileBodySchema,
} from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { AccountService } from './account.service.js';

/** The caller's own account: T17 (GV) and the 001 part of S10 (HV). */
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get()
  get(@CurrentUser() p: AuthPrincipal): Promise<AccountResponse> {
    return this.account.get(p);
  }

  @Roles('GV')
  @Patch('profile')
  updateProfile(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<AccountResponse> {
    return this.account.updateProfile(p, parse(profileBodySchema, body).displayName);
  }

  /** HV e-mails are changed by the GV only (AC-16.5). */
  @Roles('GV')
  @Post('email')
  @HttpCode(200)
  changeEmail(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<AccountResponse> {
    const { email, currentPassword } = parse(changeEmailBodySchema, body);
    return this.account.changeEmail(p, email, currentPassword);
  }

  @Post('password')
  @HttpCode(204)
  async changePassword(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<void> {
    const { currentPassword, newPassword } = parse(changePasswordBodySchema, body);
    await this.account.changePassword(p, currentPassword, newPassword);
  }
}
