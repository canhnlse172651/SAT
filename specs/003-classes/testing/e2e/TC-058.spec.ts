import { test, expect } from '@playwright/test';
import { apiAs, call, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, setVisibility, shot, signIn } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-17.1] [003:AC-17.2] [003:AC-17.5] TC-058 chỉ nội dung đã xuất bản, phần không ẩn; đường dẫn trực tiếp → A05 có nút về S02', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-058 GT', [
    { name: 'Bài 1', steps: 3 },
    { name: 'Bài 2', steps: 1, draft: true },
    { name: 'Bài 3', steps: 1, sets: 1 },
  ]);
  const l1 = cur.lessons[0]!;
  // S1 back to draft is not possible in 002 once published; S1 = a new draft step, S2 = an archived one, S3 = published.
  const draft = await ok(gv, 'POST', `/lessons/${l1.id}/items`, { section: 'lesson' });
  const s1 = draft.itemId as string;
  const s2 = l1.steps[1]!;
  const s3 = l1.steps[2]!;
  const it2 = (await ok(gv, 'GET', `/lessons/${l1.id}`)).items.find((i: { id: string }) => i.id === s2);
  await ok(gv, 'POST', `/lessons/${l1.id}/items/${s2}/archive`, { expectedVersion: it2.version });
  const hv = await newStudent(gv, 'Uyên Đường dẫn', { activate: true });
  const cls = await createClass(gv, { name: 'TC-058 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  await setVisibility(gv, cls.id, true, { kind: 'lesson', lessonId: cur.lessons[2]!.id });
  const hvApi = await apiAs('HV', hv.id);

  expect((await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${s3}`)).status).toBe(200);
  for (const id of [s1, s2]) {
    const r = await call(hvApi, 'GET', `/my-classes/${cls.id}/items/${id}`);
    expect(r.status).toBe(404);
    expect(r.body.error.message).toBe('Không tìm thấy nội dung bạn yêu cầu.');
  }

  await signIn(page, 'HV', hv.id);
  for (const lesson of [cur.lessons[1]!, cur.lessons[2]!]) {
    await page.goto(`/hv/lop/${cls.id}/bai/${lesson.id}`);
    await expect(page.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' })).toBeVisible();
    await expect(page.getByText(lesson.name, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Về trang lớp' })).toHaveAttribute('href', `/hv/lop/${cls.id}`);
  }
  await shot(page, 'TC-058', 1);
  await page.getByRole('link', { name: 'Về trang lớp' }).click();
  const rows = page.locator('.hv-list a.hv-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText('Bài 1');
  await shot(page, 'TC-058', 2);
});
