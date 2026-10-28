/* Paths of 006 screens (app/screens.ts): T10, T22, T16, T14 (exam variant), S07, S08. */

export const examsPath = '/gv/bai-thi';
export const NEW_EXAM_ID = 'moi';
export const newExamPath = `${examsPath}/${NEW_EXAM_ID}`;
export const examPath = (id: string): string => `${examsPath}/${id}`;
export const examResultsPath = (id: string, classId?: string | null): string =>
  `${examsPath}/${id}/ket-qua${classId ? `?lop=${classId}` : ''}`;
export const examSubmissionPath = (examId: string, classId: string, studentId: string): string =>
  `/gv/bai-nop?thi=${examId}&lop=${classId}&hv=${studentId}`;

export const myExamsPath = '/hv/bai-thi';
export const myExamPath = (id: string): string => `${myExamsPath}/${id}`;
/** S08 opened by "Xem kết quả": straight to the result. */
export const RESULT_PARAM = 'ket-qua';
export const myExamResultPath = (id: string): string => `${myExamPath(id)}?${RESULT_PARAM}=1`;
