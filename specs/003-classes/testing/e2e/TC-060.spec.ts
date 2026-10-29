import { test, expect } from '@playwright/test';
import { apiAs, call, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, setVisibility } from './helpers';

test('[003:AC-18.1] [003:AC-18.3] TC-060 thao tác tiếp trên bước học của phần vừa bị ẩn', async () => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-060 GT', [{ name: 'Bài 1', steps: 3, sets: 1 }]);
  const lesson = cur.lessons[0]!;
  const hv = await newStudent(gv, 'Xuân Đang Xem', { activate: true });
  const cls = await createClass(gv, { name: 'TC-060 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  const hvApi = await apiAs('HV', hv.id);
  expect((await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${lesson.steps[2]}`)).status).toBe(200);

  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: lesson.id, section: 'lesson' });
  await new Promise((r) => setTimeout(r, 5000));
  const next = await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${lesson.steps[1]}?continue=1`);
  expect(next.status).toBe(409);
  expect(next.body.error.code).toBe('CONTENT_UNAVAILABLE');
  expect(next.body.error.message).toBe('Nội dung này hiện không khả dụng.');
  expect(next.body.error.details.back).toBe(`/hv/lop/${cls.id}/bai/${lesson.id}`);
  expect(JSON.stringify(next.body)).not.toContain('Bài 1 · Bước');

  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: lesson.id, section: 'exercise' });
  const again = await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${lesson.steps[1]}?continue=1`);
  expect(again.status).toBe(409);
  expect(again.body.error.details.back).toBe(`/hv/lop/${cls.id}`);
  void ok;
});
