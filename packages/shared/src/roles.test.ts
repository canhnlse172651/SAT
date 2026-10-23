import { describe, expect, it } from 'vitest';
import { roleSchema, ROLES } from './roles.js';

describe('roles', () => {
  it('accepts GV and HV only', () => {
    expect(ROLES).toEqual(['GV', 'HV']);
    expect(roleSchema.parse('GV')).toBe('GV');
    expect(roleSchema.safeParse('admin').success).toBe(false);
  });
});
