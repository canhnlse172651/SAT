import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-21.1] [003:AC-21.7] TC-069 ô Bài tập: bộ đã xuất bản theo thứ tự, ngày hạn / Đặt hạn + Chưa mở với học viên', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-069 GT', [{ name: 'Bài 1', sets: 3, draftSets: 1 }]);
  const lesson = cur.lessons[0]!;
  const [s1, s2, s4] = lesson.sets as [string, string, string];
  const it4 = (await ok(gv, 'GET', `/lessons/${lesson.id}`)).items.find((i: { id: string }) => i.id === s4);
  await ok(gv, 'POST', `/lessons/${lesson.id}/items/${s4}/archive`, { expectedVersion: it4.version });
  const cls = await createClass(gv, { name: 'TC-069 Lớp', curriculumId: cur.id });
  const due = addDays(vnDay(), 7);
  await setDeadline(gv, cls.id, s1, due);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);

  const cell = page.locator('.cls-dl-list');
  const rows = cell.locator('.cls-dl-row');
  await expect(rows).toHaveCount(3); // 2 sets + the bulk row
  await expect(rows.nth(0)).toContainText('Bài 1 · Bộ 1');
  await expect(rows.nth(1)).toContainText('Bài 1 · Bộ 2');
  await expect(page.getByRole('button', { name: `Hạn nộp Bài 1 · Bộ 1: ${ddmmyyyy(due)}` })).toHaveText(ddmmyyyy(due));
  await expect(page.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 2: chưa đặt' })).toHaveText('Đặt hạn');
  await expect(rows.nth(1)).toContainText('Chưa mở với học viên');
  await expect(rows.nth(0)).not.toContainText('Chưa mở với học viên');
  await expect(cell).not.toContainText('Bộ nháp');
  await expect(cell).not.toContainText('Bài 1 · Bộ 3');
  await expect(rows.nth(2)).toContainText('Đặt hạn cho mọi bộ của bài');
  await shot(page, 'TC-069', 1);
  void s2;
});
