import { describe, expect, it } from 'vitest';
import { apiErrorSchema, ERROR_CODES } from './errors.js';

describe('errors', () => {
  it('lists the error codes', () => {
    expect(Object.values(ERROR_CODES)).toEqual([
      'VALIDATION_ERROR',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'RATE_LIMITED',
      'INTERNAL',
    ]);
  });
  it('parses the error body with and without details', () => {
    const base = { code: 'NOT_FOUND', message: 'x', requestId: 'r1' };
    expect(apiErrorSchema.safeParse({ error: base }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ error: { ...base, details: [1] } }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ error: { code: 'X', message: 'm' } }).success).toBe(false);
    expect(apiErrorSchema.safeParse({ code: 'X' }).success).toBe(false);
  });
});
