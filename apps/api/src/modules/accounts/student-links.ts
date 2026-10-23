/**
 * What other modules know about a student, asked by module 001 without importing them:
 * - 003 Lớp học: how many classes a student is in (AC-11.1, AC-13.1) and removal from classes (AC-13.2);
 * - 005 Bài tập / 006 Bài thi: whether the student has a submission (AC-13.2, AC-13.3);
 * - 012–015 Tự học: purge of self-study data on delete (AC-20.6) — never counted as a submission.
 * Until those modules exist the defaults below apply; each module re-binds `STUDENT_LINKS` to a
 * provider that combines them.
 */
export interface StudentLinks {
  classCounts(workspaceId: string, studentIds: readonly string[]): Promise<Map<string, number>>;
  hasSubmissions(workspaceId: string, studentId: string): Promise<boolean>;
  /** Called after a student was deleted: remove memberships and learning data (within 24 h for self-study). */
  onStudentDeleted(workspaceId: string, studentId: string): Promise<void>;
}

export const STUDENT_LINKS = Symbol('STUDENT_LINKS');

/** No classes, no submissions, nothing to purge yet. */
export class NoStudentLinks implements StudentLinks {
  classCounts(): Promise<Map<string, number>> {
    return Promise.resolve(new Map());
  }

  hasSubmissions(): Promise<boolean> {
    return Promise.resolve(false);
  }

  onStudentDeleted(): Promise<void> {
    return Promise.resolve();
  }
}
