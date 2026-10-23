import { describe, expect, it } from 'vitest';
import { z, ZodError } from 'zod';
import { parse } from './parse.js';

describe('parse', () => {
  const schema = z.object({ n: z.coerce.number().int() });

  it('returns the typed, coerced value', () => {
    expect(parse(schema, { n: '3' })).toEqual({ n: 3 });
  });

  it('throws ZodError on invalid input', () => {
    expect(() => parse(schema, { n: 'x' })).toThrow(ZodError);
  });
});
