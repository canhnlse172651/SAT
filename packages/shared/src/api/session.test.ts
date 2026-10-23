import { describe, expect, it } from 'vitest';
import { sessionResponseSchema } from './session.js';

const ok = {
  user: { id: 'u1', role: 'GV', displayName: 'Co Lan' },
  workspace: { id: 'w1', name: 'Lop co Lan' },
};

describe('sessionResponseSchema', () => {
  it('parses a valid session', () => {
    expect(sessionResponseSchema.parse(ok)).toEqual(ok);
  });
  it('rejects bad role and non-string ids', () => {
    expect(
      sessionResponseSchema.safeParse({ ...ok, user: { ...ok.user, role: 'X' } }).success,
    ).toBe(false);
    expect(
      sessionResponseSchema.safeParse({ ...ok, workspace: { id: 1, name: 'a' } }).success,
    ).toBe(false);
  });
});
