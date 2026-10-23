import { test, expect } from '@playwright/test';
import { apiAs, call, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-17.7] TC-059 HV không thấy nhãn AI hay nội dung AI chưa duyệt', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-059 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const lesson = cur.lessons[0]!;
  // 010 stand-in of 002: an AI label on the Bài, and an approved AI section ("AI tạo" items).
  await ok(gv, 'POST', '/dev/curriculum/ai-label', { lessonId: lesson.id, state: 'review' });
  await ok(gv, 'POST', '/dev/curriculum/ai-approve', {
    lessonId: lesson.id,
    section: 'lesson',
    items: [{ title: 'Bước do AI', content: { blocks: [{ type: 'text', text: '谢谢 xièxie' }] } }],
    token: (
      await ok(gv, 'POST', '/dev/curriculum/ai-approve/preview', {
        lessonId: lesson.id,
        section: 'lesson',
        items: [{ title: 'Bước do AI', content: { blocks: [{ type: 'text', text: '谢谢 xièxie' }] } }],
      })
    ).token,
  });
  const hv = await newStudent(gv, 'Vân AI', { activate: true });
  const cls = await createClass(gv, { name: 'TC-059 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  await setDeadline(gv, cls.id, lesson.sets[0]!, vnDay());
  const hvApi = await apiAs('HV', hv.id);
  const unit = await ok(hvApi, 'GET', `/my-classes/${cls.id}/lessons/${lesson.id}`);
  const responses = [
    await call(hvApi, 'GET', '/my-classes'),
    await call(hvApi, 'GET', `/my-classes/${cls.id}`),
    { status: 200, body: unit },
    await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${unit.steps[0].id}`),
  ];
  for (const r of responses) {
    expect(r.status).toBe(200);
    const text = JSON.stringify(r.body);
    expect(text).not.toMatch(/"ai"|AI ·|AI tạo|Chờ duyệt/);
  }
  expect(unit.steps.map((s: { title: string }) => s.title)).toEqual(['Bước do AI']);

  await signIn(page, 'HV', hv.id);
  for (const path of ['/hv', `/hv/lop/${cls.id}`, `/hv/lop/${cls.id}/bai/${lesson.id}`]) {
    await page.goto(path);
    await expect(page.locator('main')).not.toContainText(/AI ·|AI tạo|Chờ duyệt/);
  }
  await shot(page, 'TC-059', 1);
});
