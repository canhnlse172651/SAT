import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// ADR-0005: scrypt N=2^15 r=8 p=1, 16-byte salt, 64-byte key, parameters stored with the hash.
const PARAMS = { ln: 15, r: 8, p: 1 } as const;
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const MAX_PASSWORD_BYTES = 1024;
const MAX_LN = 20;
const FORMAT = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/]+=*)\$([A-Za-z0-9+/]+=*)$/;

interface Parsed {
  ln: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
}

function derive(password: string, salt: Buffer, ln: number, r: number, p: number, keyLen: number) {
  const N = 2 ** ln;
  return new Promise<Buffer>((resolve, reject) => {
    // Node's default maxmem (32 MiB) rejects N=2^15, r=8; allow 2x the memory the parameters need.
    scrypt(password, salt, keyLen, { N, r, p, maxmem: 256 * N * r }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

function parseEncoded(encoded: string): Parsed | undefined {
  const m = FORMAT.exec(encoded);
  if (!m) return undefined;
  const [ln, r, p] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ln < 1 || ln > MAX_LN || r < 1 || r > 32 || p < 1 || p > 16) return undefined;
  return {
    ln,
    r,
    p,
    salt: Buffer.from(m[4] ?? '', 'base64'),
    key: Buffer.from(m[5] ?? '', 'base64'),
  };
}

export async function hashPassword(password: string): Promise<string> {
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) throw new Error('Password too long');
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, PARAMS.ln, PARAMS.r, PARAMS.p, KEY_BYTES);
  return `$scrypt$ln=${PARAMS.ln},r=${PARAMS.r},p=${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/** False for a wrong password, an oversized input or a malformed stored hash — never throws on bad data. */
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return false;
  const parsed = parseEncoded(encoded);
  if (!parsed || parsed.key.length === 0) return false;
  const key = await derive(password, parsed.salt, parsed.ln, parsed.r, parsed.p, parsed.key.length);
  return key.length === parsed.key.length && timingSafeEqual(key, parsed.key);
}

/** True when the stored hash uses other parameters than the current ones (re-hash on next login). */
export function needsRehash(encoded: string): boolean {
  const parsed = parseEncoded(encoded);
  return (
    !parsed ||
    parsed.ln !== PARAMS.ln ||
    parsed.r !== PARAMS.r ||
    parsed.p !== PARAMS.p ||
    parsed.salt.length !== SALT_BYTES ||
    parsed.key.length !== KEY_BYTES
  );
}
