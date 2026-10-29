import { test, expect } from '@playwright/test';
import { call, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-14.6] [003:NFR-7] TC-050 GV khác workspace: A05 và 404 cho mọi thao tác, không lộ thông tin', async ({ page }) => {
  const gvA = await newWorkspaceGv();
  const cur = await seedCurriculum(gvA, 'TC-050 GT bí mật', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const hvA = await newStudent(gvA, 'Học Viên A', { activate: true });
  const cls = await createClass(gvA, { name: 'TC-050 Lớp bí mật', curriculumId: cur.id, studentIds: [hvA.id] });
  const gvB = await newWorkspaceGv();
  const curB = await seedCurriculum(gvB, 'TC-050 GT của B', [{ name: 'Bài 1', steps: 1 }]);
  const hvB = await newStudent(gvB, 'Học Viên B');
  const clsB = await createClass(gvB, { name: 'TC-050 Lớp B', curriculumId: curB.id });

  await signInLike(page, gvB);
  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' })).toBeVisible();
  await expect(page.getByText('TC-050 Lớp bí mật')).toHaveCount(0);
  await shot(page, 'TC-050', 1);

  const lesson = cur.lessons[0]!;
  const id = cls.id;
  const writes: [string, string, unknown?][] = [
    ['GET', `/classes/${id}`],
    ['PATCH', `/classes/${id}`, { expectedVersion: 1, name: 'x' }],
    ['POST', `/classes/${id}/students`, { studentIds: [hvB.id] }],
    ['DELETE', `/classes/${id}/students/${hvA.id}`],
    ['PUT', `/classes/${id}/visibility`, { hidden: true, scope: { kind: 'section', lessonId: lesson.id, section: 'lesson' } }],
    ['POST', `/classes/${id}/visibility/preview`, { hidden: true, scope: { kind: 'column', section: 'lesson' } }],
    ['PUT', `/classes/${id}/deadlines`, { target: { setId: lesson.sets[0] }, date: vnDay() }],
    ['PUT', `/classes/${id}/curriculum`, { curriculumId: curB.id }],
    ['POST', `/classes/${id}/end`],
    ['POST', `/classes/${id}/reopen`],
    ['DELETE', `/classes/${id}`],
    ['GET', `/classes/${id}/students`],
    ['GET', `/classes/${id}/content`],
    // References to the other workspace's HV / curriculum from B's own class or wizard.
    ['POST', `/classes/${clsB.id}/students`, { studentIds: [hvA.id] }],
    ['PUT', `/classes/${clsB.id}/curriculum`, { curriculumId: cur.id }],
    ['POST', '/classes', { name: `TC-050 X ${Date.now()}`, startDate: vnDay(), curriculumId: cur.id, studentIds: [], createKey: `k-${Date.now()}-xxxxxx` }],
    ['POST', '/classes', { name: `TC-050 Y ${Date.now()}`, startDate: vnDay(), curriculumId: curB.id, studentIds: [hvA.id], createKey: `k-${Date.now()}-yyyyyy` }],
    // Malformed ids.
    ['GET', '/classes/not-an-id'],
    ['DELETE', '/classes/123/students/abc'],
  ];
  for (const [method, path, body] of writes) {
    const r = await call(gvB, method, path, body);
    expect(r.status, `${method} ${path}`).toBe(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
    expect(r.body.error.message).toBe('Không tìm thấy nội dung bạn yêu cầu.');
    const text = JSON.stringify(r.body);
    for (const secret of ['bí mật', 'Học Viên A', cur.name]) expect(text).not.toContain(secret);
  }
  const still = await ok(gvA, 'GET', `/classes/${id}`);
  expect(still.name).toBe('TC-050 Lớp bí mật');
  expect(still.memberCount).toBe(1);
  expect(still.status).toBe('active');
});
