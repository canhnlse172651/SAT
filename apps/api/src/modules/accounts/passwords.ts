import { randomInt } from 'node:crypto';

// AC-2.5: Latin letters and digits without the look-alikes 0 O o 1 l I.
const LETTERS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALPHABET = LETTERS + DIGITS;
const LENGTH = 10;

/** A fresh 10-character password with at least one letter and one digit (CSPRNG, unbiased). */
export function randomPassword(): string {
  for (;;) {
    let out = '';
    for (let i = 0; i < LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
    if (/[a-zA-Z]/.test(out) && /\d/.test(out)) return out;
  }
}
