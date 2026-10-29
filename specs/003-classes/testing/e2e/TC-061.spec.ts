import { test, expect } from '@playwright/test';
import { apiAs, createClass, hvSave, hvSubmit, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, setVisibility, vnDay } from './helpers';

test('[003:AC-18.2] TC-061 lưu / nộp lượt dở của phần vừa bị ẩn: từ chối, lượt dở giữ; hiện lại thì nộp được', async () => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-061 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const lesson = cur.lessons[0]!;
  const x = lesson.sets[0]!;
  const hv = await newStudent(gv, 'Yến Làm Dở', { activate: true });
  const cls = await createClass(gv, { name: 'TC-061 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  await setDeadline(gv, cls.id, x, vnDay());
  const hvApi = await apiAs('HV', hv.id);
  expect((await hvSave(hvApi, cls.id, x)).status).toBe(200);

  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: lesson.id, section: 'exercise' });
  for (const r of [await hvSave(hvApi, cls.id, x), await hvSubmit(hvApi, cls.id, x)]) {
    expect(r.status).toBe(409);
    expect(r.body.error.message).toBe('Bài tập này hiện không khả dụng. Câu trả lời đã lưu của bạn được giữ lại.');
    expect(r.body.error.details.back).toBe(`/hv/lop/${cls.id}/bai/${lesson.id}`);
  }
  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: lesson.id, section: 'lesson' });
  const r2 = await hvSubmit(hvApi, cls.id, x);
  expect(r2.body.error.details.back).toBe(`/hv/lop/${cls.id}`);

  await setVisibility(gv, cls.id, false, { kind: 'lesson', lessonId: lesson.id });
  const unit = await ok(hvApi, 'GET', `/my-classes/${cls.id}/lessons/${lesson.id}`);
  expect(unit.sets[0].status).toBe('doing'); // the attempt was kept
  expect((await hvSubmit(hvApi, cls.id, x)).status).toBe(200);
});
