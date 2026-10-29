import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signIn } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-13.4] [003:AC-13.5] [003:AC-13.7] TC-044 nhãn Chưa có bài tập / Chưa có nội dung / Bài tập chưa mở; lớp chưa có bài', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-044 GT', [
    { name: 'Bài 1', steps: 1 },
    { name: 'Bài 2', steps: 1, draftSets: 1 },
    { name: 'Bài 3', sets: 1 },
  ]);
  // Bài 2: published, then its only published item archived — left with a draft set only (002 rules).
  const l2 = cur.lessons[1]!;
  const step = (await ok(gv, 'GET', `/lessons/${l2.id}`)).items.find((i: { id: string }) => i.id === l2.steps[0]);
  await ok(gv, 'POST', `/lessons/${l2.id}/items/${step.id}/archive`, { expectedVersion: step.version });
  const empty = await seedCurriculum(gv, 'TC-044 Rỗng', [{ name: 'Nháp', steps: 1, draft: true }]);
  const hv = await newStudent(gv, 'Linh Nhãn', { activate: true });
  const a = await createClass(gv, { name: 'TC-044 A', curriculumId: cur.id, studentIds: [hv.id] });
  const b = await createClass(gv, { name: 'TC-044 B', curriculumId: empty.id, studentIds: [hv.id] });
  expect((await ok(gv, 'GET', `/lessons/${cur.lessons[1]!.id}`)).status).toBe('published');
  await signIn(page, 'HV', hv.id);

  await page.goto(`/hv/lop/${a.id}`);
  const rows = page.locator('.hv-list a.hv-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Chưa có bài tập');
  await expect(rows.nth(1)).toContainText('Chưa có nội dung');
  await expect(rows.nth(2)).toContainText('Bài tập chưa mở');
  await shot(page, 'TC-044', 1);
  await rows.nth(2).click();
  await expect(page.locator('.hv-unit-head')).toContainText('Bài tập chưa mở');

  await page.goto(`/hv/lop/${b.id}`);
  await expect(page.getByText('Lớp chưa có bài nào. Giáo viên sẽ cập nhật nội dung sau.', { exact: true })).toBeVisible();
  await shot(page, 'TC-044', 2);
});
