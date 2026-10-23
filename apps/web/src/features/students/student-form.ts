import type { Student } from '@sat/shared';

export interface StudentFormValue {
  displayName: string;
  email: string;
  phone: string;
  note: string;
}

export const EMPTY_STUDENT: StudentFormValue = { displayName: '', email: '', phone: '', note: '' };

export const studentFormOf = (s: Student): StudentFormValue => ({
  displayName: s.displayName,
  email: s.email,
  phone: s.phone ?? '',
  note: s.note ?? '',
});
