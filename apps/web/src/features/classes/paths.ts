/** Screen paths of module 003 and the HV screens it links to (app/screens.ts). */
export const classesPath = '/gv/lop-hoc';
export const newClassPath = `${classesPath}/tao-moi`;
export type ClassTab = 'tong-quan' | 'hoc-vien' | 'noi-dung' | 'tien-do' | 'xep-hang';
export const classPath = (id: string, tab?: ClassTab) =>
  `${classesPath}/${id}${tab && tab !== 'tong-quan' ? `?tab=${tab}` : ''}`;

export const myClassesPath = '/hv';
export const myClassPath = (id: string) => `/hv/lop/${id}`;
export const myLessonPath = (classId: string, lessonId: string) =>
  `${myClassPath(classId)}/bai/${lessonId}`;
/** S03 (004), S05 / S06 (005), S07 (006), S09 (008), S10 / S12 (011). */
export const stepPath = (classId: string, stepId: string) =>
  `${myClassPath(classId)}/buoc/${stepId}`;
export const setPath = (classId: string, setId: string) =>
  `${myClassPath(classId)}/bai-tap/${setId}`;
export const setResultPath = (classId: string, setId: string) =>
  `${setPath(classId, setId)}/ket-qua`;
/** T14 (005) of one submission. */
export const submissionPath = (classId: string, studentId: string, setId: string) =>
  `/gv/bai-nop?${new URLSearchParams({ lop: classId, hv: studentId, bo: setId }).toString()}`;
export const examsPath = '/hv/bai-thi';
export const rankingPath = '/hv/xep-hang';
export const myProfilePath = '/hv/ho-so';
export const studentProfilePath = (studentId: string) => `/hv/hoc-vien/${studentId}`;
