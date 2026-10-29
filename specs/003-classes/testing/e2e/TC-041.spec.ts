import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-12.1] [003:AC-12.2] [003:NFR-3] TC-041 S01 thẻ lớp, thứ tự, dòng Bắt đầu ngày; 10 lớp ≤ 3 giây', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-041 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }], 2);
  const hv = await newStudent(gv, 'Hằng Lớp', { activate: true });
  const today = vnDay();
  const mk = (name: string, startDate: string) => createClass(gv, { name, curriculumId: cur.id, studentIds: [hv.id], startDate });
  await mk('Lớp A', addDays(today, -22));
  await mk('Lớp B', addDays(today, -8));
  await mk('Lớp C', addDays(today, 13));
  await mk('Lớp D', addDays(today, 9));
  const e = await mk('Lớp E', addDays(today, -60));
  await ok(gv, 'POST', `/classes/${e.id}/end`);
  await signIn(page, 'HV', hv.id);
  await page.goto('/hv');

  const cards = page.locator('.hv-class-card');
  await expect(cards).toHaveCount(5);
  const names = await cards.locator('.hv-class-card__name').allTextContents();
  expect(names).toEqual(['Lớp B', 'Lớp A', 'Lớp D', 'Lớp C', 'Lớp E']);
  const b = cards.nth(0);
  await expect(b).toContainText('Đang học');
  await expect(b).toContainText(ddmmyyyy(addDays(today, -8)));
  await expect(b).toContainText('HSK2');
  await expect(b).toContainText('TC-041 GT');
  await expect(cards.nth(2)).toContainText(`Bắt đầu ngày ${ddmmyyyy(addDays(today, 9))}`);
  await expect(cards.nth(3)).toContainText(`Bắt đầu ngày ${ddmmyyyy(addDays(today, 13))}`);
  await expect(cards.nth(2)).not.toContainText('bộ bài tập');
  await expect(cards.nth(4)).toContainText('Đã kết thúc');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await shot(page, 'TC-041', 1);

  await cards.nth(1).click();
  await expect(page).toHaveURL(/\/hv\/lop\/[0-9a-f]{24}$/);
  await expect(page.getByRole('heading', { name: 'Lớp A' })).toBeVisible();

  // NFR-3: an HV in 10 classes.
  for (let i = 0; i < 5; i++) await mk(`Lớp thêm ${i}`, addDays(today, -1));
  const t0 = Date.now();
  await page.goto('/hv');
  await expect(cards).toHaveCount(10);
  const ms = Date.now() - t0;
  expect(ms).toBeLessThanOrEqual(3000);
  test.info().annotations.push({ type: 'NFR-3', description: `S01 with 10 classes in ${ms} ms (desktop CPU, local network)` });
});
