import { test, expect } from '@playwright/test';
import {
  addDays,
  createClass,
  ddmm,
  newStudent,
  newWorkspaceGv,
  ok,
  seedCurriculum,
  setDeadline,
  setVisibility,
  shot,
  signIn,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-13.6] [003:AC-17.3] [003:AC-22.4] TC-045 hai lớp cùng giáo trình: ẩn và hạn nộp chỉ theo lớp; Bài mới Hiển thị, bộ mới Chưa mở', async ({
  page,
  browser,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-045 GT', [
    { name: 'Bài 1', steps: 1, sets: 1 },
    { name: 'Bài 2', steps: 1, sets: 1 },
  ]);
  const hv = await newStudent(gv, 'Minh Hai Lớp', { activate: true });
  const a = await createClass(gv, { name: 'TC-045 A', curriculumId: cur.id, studentIds: [hv.id] });
  const b = await createClass(gv, { name: 'TC-045 B', curriculumId: cur.id, studentIds: [hv.id] });
  await setVisibility(gv, a.id, true, { kind: 'section', lessonId: cur.lessons[1]!.id, section: 'exercise' });
  const x = cur.lessons[0]!.sets[0]!;
  const due = addDays(vnDay(), 4);
  await setDeadline(gv, a.id, x, due);
  await signIn(page, 'HV', hv.id);

  await page.goto(`/hv/lop/${a.id}`);
  const rowsA = page.locator('.hv-list a.hv-row');
  await expect(rowsA.nth(1)).toContainText('Bài 2');
  await expect(rowsA.nth(1)).not.toContainText('Bài tập');
  await page.goto(`/hv/lop/${a.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  await expect(page.getByRole('link', { name: /Bài 1 · Bộ 1/ })).toContainText(`Hạn nộp ${ddmm(due)}`);
  await shot(page, 'TC-045', 1);

  await page.goto(`/hv/lop/${b.id}`);
  await expect(page.locator('.hv-list a.hv-row').nth(1)).toContainText('Bài tập');
  await page.goto(`/hv/lop/${b.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  const closed = page.getByRole('group', { name: 'Bài 1 · Bộ 1 — Chưa mở' });
  await expect(closed).toContainText('Chưa mở');
  await expect(closed).not.toContainText('Hạn nộp');
  await shot(page, 'TC-045', 2);

  const gvPage = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await signInLike(gvPage, gv);
  await gvPage.goto(`/gv/lop-hoc/${b.id}?tab=noi-dung`);
  await expect(gvPage.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 1: chưa đặt' })).toHaveText('Đặt hạn');

  // A new Bài published in the curriculum: shown in both classes, sections "Hiển thị", its set "Chưa mở".
  const l4 = await ok(gv, 'POST', `/curricula/${cur.id}/lessons`, { name: 'Bài 4' });
  const added = await ok(gv, 'POST', `/lessons/${l4.id}/items`, { section: 'exercise' });
  const item = added.lesson.items.find((i: { id: string }) => i.id === added.itemId);
  await ok(gv, 'POST', `/lessons/${l4.id}/items/${added.itemId}/publish`, {
    expectedVersion: item.version,
    title: 'Bộ mới',
    content: { questions: [{ type: 'mcq', prompt: '?', options: ['a', 'b'], answer: 0 }] },
  });
  const fresh = await ok(gv, 'GET', `/lessons/${l4.id}`);
  await ok(gv, 'POST', `/lessons/${l4.id}/publish`, { expectedVersion: fresh.version, itemIds: [] });
  for (const c of [a, b]) {
    await page.goto(`/hv/lop/${c.id}`);
    await expect(page.locator('.hv-list a.hv-row').nth(2)).toContainText('Bài 4');
    await page.goto(`/hv/lop/${c.id}/bai/${l4.id}?tab=bai-tap`);
    await expect(page.getByRole('group', { name: 'Bộ mới — Chưa mở' })).toBeVisible();
  }
  await gvPage.goto(`/gv/lop-hoc/${a.id}?tab=noi-dung`);
  const row = gvPage.getByRole('row').filter({ hasText: 'Bài 4' });
  await expect(row.getByText('Hiển thị', { exact: true })).toHaveCount(2);
  await shot(gvPage, 'TC-045', 3);
});
