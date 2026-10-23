import { test, expect } from '@playwright/test';
import { createClass, newWorkspaceGv, ok, seedCurriculum } from './helpers';

test('[003:AC-11.5] TC-040 xóa lớp bỏ lớp khỏi các bài thi được giao, bài thi và lớp khác giữ nguyên', async () => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-040 GT', [{ name: 'Bài 1', steps: 1 }]);
  const l = await createClass(gv, { name: 'TC-040 L', curriculumId: cur.id });
  const m = await createClass(gv, { name: 'TC-040 M', curriculumId: cur.id });
  const e1 = await ok(gv, 'POST', '/dev/classes/exams', { classIds: [l.id, m.id] });
  const e2 = await ok(gv, 'POST', '/dev/classes/exams', { classIds: [l.id, m.id] });
  await ok(gv, 'DELETE', `/classes/${l.id}`);
  for (const e of [e1, e2]) {
    const exam = await ok(gv, 'GET', `/dev/classes/exams/${e.id}`);
    expect(exam.classIds).toEqual([m.id]);
  }
});
