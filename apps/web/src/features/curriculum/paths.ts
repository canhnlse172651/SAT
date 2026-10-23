/** Screen paths of module 002 (app/screens.ts). */
export const curriculaPath = '/gv/giao-trinh';
export const curriculumPath = (cid: string) => `${curriculaPath}/${cid}`;
export const lessonPath = (cid: string, lid: string) => `${curriculumPath(cid)}/bai/${lid}`;
/** T07 opens on the Bài học tab, T09 on the Bài tập tab (AC-7.12). */
export const editorPath = (cid: string, lid: string, tab: 'lesson' | 'exercise' = 'lesson') =>
  `${lessonPath(cid, lid)}/${tab === 'lesson' ? 'bai-hoc' : 'thu-cong'}`;
export const previewPath = (cid: string, lid: string) => `${lessonPath(cid, lid)}/xem-truoc`;
export const aiReviewPath = (cid: string, lid: string) => `${lessonPath(cid, lid)}/review-ai`;
/** T04 of 003, tab Nội dung (AC-4.4). */
export const classContentPath = (classId: string) => `/gv/lop-hoc/${classId}?tab=noi-dung`;
