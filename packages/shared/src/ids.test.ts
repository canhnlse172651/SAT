import { describe, expect, it } from 'vitest';
import { objectId } from './ids.js';

describe('objectId', () => {
  it('accepts a 24-char hex string', () => {
    expect(objectId.safeParse('64b7f0c2a1b2c3d4e5f60718').success).toBe(true);
  });
  it('rejects other strings and non-strings', () => {
    for (const v of ['', 'xyz', '64b7f0c2a1b2c3d4e5f6071', '64b7f0c2a1b2c3d4e5f607189', 12, null]) {
      expect(objectId.safeParse(v).success).toBe(false);
    }
  });
});
