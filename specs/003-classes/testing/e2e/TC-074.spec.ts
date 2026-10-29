import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newWorkspaceGv, ok, pickDay, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-22.1] [003:AC-22.2] [003:NFR-4] TC-074 đặt / xóa hạn cho mọi bộ của Bài; 20 bộ ≤ 3 giây', async ({ page }) => {
  test.setTimeout(240_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-074 GT', [
    { name: 'Bài 1', steps: 1 },
    { name: 'Bài 2', steps: 1 },
    { name: 'Bài 3', sets: 3, draftSets: 1 },
  ]);
  const l3 = cur.lessons[2]!;
  const cls = await createClass(gv, { name: 'TC-074 Lớp', curriculumId: cur.id });
  await setDeadline(gv, cls.id, l3.sets[0]!, addDays(vnDay(), 9));
  const due = addDays(vnDay(), 13);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);

  await page.getByRole('button', { name: 'Đặt hạn cho mọi bộ của bài Bài 3: chưa đặt' }).click();
  const pop = page.getByRole('dialog', { name: 'Đặt hạn cho mọi bộ của bài Bài 3' });
  await pickDay(pop, due);
  await pop.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(
    page.getByText(
      `Đã đặt hạn nộp 23:59 ${ddmmyyyy(due)} cho 3 bộ bài tập. Nhắc học viên chưa làm lúc 08:00 ngày hạn.`,
      { exact: true },
    ),
  ).toBeVisible();
  for (let i = 1; i <= 3; i++)
    await expect(page.getByRole('button', { name: `Hạn nộp Bài 3 · Bộ ${i}: ${ddmmyyyy(due)}` })).toBeVisible();
  const content = await ok(gv, 'GET', `/classes/${cls.id}/content`);
  expect(content.lessons[2].sets.every((s: { deadline: string }) => s.deadline === due)).toBe(true);
  await shot(page, 'TC-074', 1);

  await page.getByRole('button', { name: 'Đặt hạn cho mọi bộ của bài Bài 3: chưa đặt' }).click();
  await pop.getByRole('button', { name: 'Xóa' }).click();
  await expect(
    page.getByText('Đã xóa hạn nộp của 3 bộ bài tập. Các bộ này chuyển sang “Chưa mở” với học viên.', { exact: true }),
  ).toBeVisible();
  for (let i = 1; i <= 3; i++)
    await expect(page.getByRole('button', { name: `Hạn nộp Bài 3 · Bộ ${i}: chưa đặt` })).toHaveText('Đặt hạn');
  await shot(page, 'TC-074', 2);

  // NFR-4: bulk set / clear for a Bài of 20 sets.
  const big = await seedCurriculum(gv, 'TC-074 20 bộ', [{ name: 'Bài lớn', sets: 20 }]);
  const c20 = await createClass(gv, { name: 'TC-074 20', curriculumId: big.id });
  for (const date of [due, null]) {
    const t0 = Date.now();
    const r = await ok(gv, 'PUT', `/classes/${c20.id}/deadlines`, { target: { lessonId: big.lessons[0]!.id }, date });
    const ms = Date.now() - t0;
    expect(r.changed).toBe(20);
    expect(ms).toBeLessThanOrEqual(3000);
    test.info().annotations.push({ type: 'NFR-4', description: `bulk deadline ${date ?? 'clear'} for 20 sets in ${ms} ms` });
  }
});
