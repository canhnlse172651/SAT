import { scryptSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPassword, needsRehash, verifyPassword } from './password.js';

describe('password hashing (scrypt)', () => {
  it('hashes to a self-describing string with the ADR-0005 parameters', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).toMatch(/^\$scrypt\$ln=15,r=8,p=1\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
    expect(needsRehash(hash)).toBe(false);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', hash)).toBe(true);
    expect(await verifyPassword('wrong horse', hash)).toBe(false);
  });

  it('salts: the same password hashes differently each time', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('rejects malformed hashes and oversized input without throwing', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x'.repeat(2000), await hashPassword('x'))).toBe(false);
    await expect(hashPassword('x'.repeat(2000))).rejects.toThrow();
  });

  it('flags hashes with other parameters for re-hash and still verifies them', async () => {
    const salt = Buffer.alloc(16, 1);
    const key = scryptSync('old', salt, 64, { N: 2 ** 14, r: 8, p: 1 });
    const old = `$scrypt$ln=14,r=8,p=1$${salt.toString('base64')}$${key.toString('base64')}`;
    expect(needsRehash(old)).toBe(true);
    expect(needsRehash('garbage')).toBe(true);
    expect(await verifyPassword('old', old)).toBe(true);
  });
});
