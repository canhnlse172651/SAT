import { describe, expect, it } from 'vitest';
import { paginationQuerySchema } from './pagination.js';

describe('paginationQuerySchema', () => {
  it('defaults page 1 and limit 20', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });
  it('coerces query strings', () => {
    expect(paginationQuerySchema.parse({ page: '3', limit: '100' })).toEqual({
      page: 3,
      limit: 100,
    });
  });
  it.each([{ page: '0' }, { page: '1.5' }, { limit: '0' }, { limit: '101' }, { limit: 'x' }])(
    'rejects %j',
    (q) => {
      expect(paginationQuerySchema.safeParse(q).success).toBe(false);
    },
  );
});
