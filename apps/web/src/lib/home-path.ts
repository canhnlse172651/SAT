import type { Role } from '@sat/shared';

export const LOGIN_PATH = '/dang-nhap';
export const NOT_FOUND_PATH = '/khong-tim-thay';

export const homePath = (role: Role | undefined): string =>
  role === 'GV' ? '/gv' : role === 'HV' ? '/hv' : LOGIN_PATH;

export const loginPathWithReturn = (returnTo: string): string =>
  `${LOGIN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
