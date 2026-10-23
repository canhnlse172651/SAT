import { ACCOUNT_MESSAGES, type SessionFailureReason } from '@sat/shared';

/** Router state A01 reads to show a notice after a redirect (logout, expired / locked session, reset done). */
export interface LoginNoticeState {
  notice?: string;
}

/** The A01 notice for why a session ended (001 AC-5.4, AC-12.3, AC-15.3); none when there never was a session. */
export function sessionNotice(reason: SessionFailureReason | null | undefined): string | undefined {
  switch (reason) {
    case 'expired':
      return ACCOUNT_MESSAGES.sessionExpired;
    case 'locked':
      return ACCOUNT_MESSAGES.accountLocked;
    case 'too_many_attempts':
      return ACCOUNT_MESSAGES.tooManyPasswordAttempts;
    default:
      return undefined;
  }
}
