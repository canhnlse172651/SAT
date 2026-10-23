import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_MESSAGES as M,
  bulkSelectionSchema,
  changePasswordBodySchema,
  emailSchema,
  fieldErrors,
  isValidPassword,
  normalizeEmail,
  passwordRules,
  registerBodySchema,
  studentBodySchema,
  workspaceMailLimitMessage,
} from './accounts.js';

const messages = (r: {
  error?: { issues: { path: PropertyKey[]; message: string }[] } | undefined;
}) => fieldErrors(r.error?.issues ?? []);

describe('field rules', () => {
  it('[001:AC-2.2] e-mails are trimmed and lower-cased', () => {
    expect(emailSchema.parse('  An@Mail.COM ')).toBe('an@mail.com');
    expect(normalizeEmail(' A@B.vn ')).toBe('a@b.vn');
  });

  it('[001:AC-1.3] e-mail must be ASCII, well-formed and at most 254 characters', () => {
    for (const bad of ['an@mail', 'nguyễn@mail.com', 'a b@x.vn', `${'a'.repeat(250)}@x.vn`]) {
      expect(emailSchema.safeParse(bad).error?.issues[0]?.message).toBe(M.emailInvalid);
    }
    expect(emailSchema.safeParse('   ').error?.issues[0]?.message).toBe(M.emailRequired);
  });

  it('[001:AC-2.3] password rules: 8–64 characters with a letter and a digit (Unicode letters count)', () => {
    expect(passwordRules('abc').map((r) => r.ok)).toEqual([false, false]);
    expect(passwordRules('abcdefgh').map((r) => r.ok)).toEqual([true, false]);
    expect(isValidPassword('abcdefg1')).toBe(true);
    expect(isValidPassword('ănhđờ123')).toBe(true);
    expect(isValidPassword(`a1${'x'.repeat(63)}`)).toBe(false);
  });

  it('[001:AC-2.1] [001:AC-2.4] register: one message per field, required first, confirmation must match', () => {
    const empty = registerBodySchema.safeParse({ displayName: ' ', email: '', password: '' });
    expect(messages(empty)).toEqual({
      displayName: M.nameRequired,
      email: M.emailRequired,
      password: M.passwordRequired,
      passwordConfirm: M.passwordMismatch,
    });
    const bad = registerBodySchema.safeParse({
      displayName: 'A',
      email: 'x@y.vn',
      password: 'Matkhau123',
      passwordConfirm: 'Matkhau124',
    });
    expect(messages(bad)).toEqual({
      displayName: M.nameLength,
      passwordConfirm: M.passwordMismatch,
    });
  });

  it('[001:AC-8.5] student fields: phone 9–15 digits with optional +, note ≤ 500, blanks are absent', () => {
    expect(
      studentBodySchema.parse({
        displayName: ' Bình ',
        email: 'B@x.vn',
        phone: '+84 901 234 567',
        note: '',
      }),
    ).toEqual({ displayName: 'Bình', email: 'b@x.vn', phone: '+84901234567' });
    const bad = studentBodySchema.safeParse({
      displayName: 'x'.repeat(101),
      email: 'a@b',
      phone: '12345',
      note: 'n'.repeat(501),
    });
    expect(messages(bad)).toEqual({
      displayName: M.nameLength,
      email: M.emailInvalid,
      phone: M.phoneInvalid,
      note: M.noteTooLong,
    });
  });

  it('[001:AC-15.1] change password needs the current password and a matching new one', () => {
    expect(
      messages(changePasswordBodySchema.safeParse({ currentPassword: '', newPassword: 'abc' })),
    ).toEqual({
      currentPassword: M.currentPasswordRequired,
      newPassword: M.passwordRules,
      newPasswordConfirm: M.passwordMismatch,
    });
  });
});

describe('bulk selection and messages', () => {
  it('[001:AC-7.2] accepts explicit ids or a filter', () => {
    expect(bulkSelectionSchema.safeParse({ ids: ['64b7f0c2a1b2c3d4e5f60718'] }).success).toBe(true);
    expect(bulkSelectionSchema.safeParse({ filter: { status: 'pending' } }).success).toBe(true);
    expect(bulkSelectionSchema.safeParse({ ids: [] }).success).toBe(false);
  });

  it('[001:AC-18.6] workspace limit message formats the remaining count', () => {
    expect(workspaceMailLimitMessage(12)).toContain('Bạn còn gửi được 12 email.');
  });
});
