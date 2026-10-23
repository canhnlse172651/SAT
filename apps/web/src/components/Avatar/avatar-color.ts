/** Prototype palette: one fixed colour per name (white initials). */
export const AVATAR_COLORS = [
  '#3f5a85',
  '#7a4b8c',
  '#2f7a6a',
  '#a0522d',
  '#4f6b2a',
  '#8c3b4f',
  '#305f9e',
  '#6b5b2e',
  '#5a4fa0',
  '#2c6d84',
] as const;

export function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + (c.codePointAt(0) ?? 0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}
