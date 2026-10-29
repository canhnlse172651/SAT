import { test, expect } from '@playwright/test';
import {
  addDays,
  apiAs,
  createClass,
  ddmmyyyy,
  hvSubmit,
  newStudent,
  newWorkspaceGv,
  seedCurriculum,
  setDeadline,
  shot,
  signIn,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-13.1] [003:AC-13.2] [003:AC-13.3] TC-043 S02: thông tin lớp, Bài theo thứ tự, nhãn phần, tiến độ', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-043 GT', [
    { name: 'Bài 1', steps: 2, sets: 2 },
    { name: 'Bài 2', steps: 1, draft: true },
    { name: 'Bài 3', steps: 1, sets: 1 },
  ], 3);
  const hv = await newStudent(gv, 'Kim Học', { activate: true });
  const start = addDays(vnDay(), -5);
  const cls = await createClass(gv, {
    name: 'TC-043 Lớp',
    curriculumId: cur.id,
    studentIds: [hv.id],
    startDate: start,
    schedule: 'Thứ 2, 4 — 18:00',
  });
  const due = addDays(vnDay(), 3);
  for (const s of [...cur.lessons[0]!.sets, ...cur.lessons[2]!.sets]) await setDeadline(gv, cls.id, s, due);
  expect((await hvSubmit(await apiAs('HV', hv.id), cls.id, cur.lessons[0]!.sets[0]!)).status).toBe(200);
  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${cls.id}`);

  await expect(page.getByRole('heading', { name: 'TC-043 Lớp' })).toBeVisible();
  const info = page.locator('.hv-info');
  await expect(info).toContainText('Đang học');
  await expect(info).toContainText(`Bắt đầu ${ddmmyyyy(start)}`);
  await expect(info).toContainText('HSK3');
  await expect(info).toContainText('TC-043 GT');
  await expect(info).toContainText('Thứ 2, 4 — 18:00');
  await expect(page.getByText('Tiến độ bài tập của tôi')).toBeVisible();
  await expect(page.locator('.hv-card')).toContainText('1/3 bộ bài tập');
  await expect(page.getByRole('link', { name: /Bảng xếp hạng/ })).toHaveAttribute('href', '/hv/xep-hang');

  const lessons = page.locator('.hv-list a.hv-row');
  await expect(lessons).toHaveCount(2);
  await expect(lessons.nth(0)).toContainText('Bài 1');
  await expect(lessons.nth(1)).toContainText('Bài 3');
  await expect(page.getByText('Bài 2', { exact: true })).toHaveCount(0);
  await expect(lessons.nth(0)).toContainText('Bài học');
  await expect(lessons.nth(0)).toContainText('Bài tập');
  await expect(lessons.nth(0)).toContainText('1/2 bộ bài tập');
  await expect(lessons.nth(1)).toContainText('0/1 bộ bài tập');
  await shot(page, 'TC-043', 1);

  await lessons.nth(1).click();
  await expect(page).toHaveURL(new RegExp(`/hv/lop/${cls.id}/bai/${cur.lessons[2]!.id}`));
  await expect(page.getByRole('heading', { name: 'Bài 3' })).toBeVisible();
});
