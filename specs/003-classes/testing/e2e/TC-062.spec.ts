import { test, expect } from '@playwright/test';
import { addDays, createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-19.1] [003:AC-19.2] [003:AC-19.6] [003:NFR-3] TC-062 S11 phần đầu, tab, bước học đánh số; Bài trống; 40 mục ≤ 3 giây', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-062 GT', [
    { name: 'Bài 1', steps: 3, sets: 2 },
    { name: 'Bài 2', steps: 1 },
    { name: 'Bài 3', steps: 1, draftSets: 1 },
    { name: 'Bài 40 mục', steps: 20, sets: 20 },
  ]);
  const l3 = cur.lessons[2]!;
  const it = (await ok(gv, 'GET', `/lessons/${l3.id}`)).items.find((i: { id: string }) => i.id === l3.steps[0]);
  await ok(gv, 'POST', `/lessons/${l3.id}/items/${it.id}/archive`, { expectedVersion: it.version });
  const hv = await newStudent(gv, 'Ánh S11', { activate: true });
  const cls = await createClass(gv, { name: 'TC-062 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  for (const s of cur.lessons[0]!.sets) await setDeadline(gv, cls.id, s, addDays(vnDay(), 3));
  await signIn(page, 'HV', hv.id);

  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}`);
  await expect(page.getByRole('heading', { name: 'Bài 1' })).toBeVisible();
  const head = page.locator('.hv-unit-head');
  await expect(head.getByRole('link', { name: 'TC-062 Lớp' })).toHaveAttribute('href', `/hv/lop/${cls.id}`);
  await expect(head).toContainText('0/2 bộ bài tập');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveText([/Bài học/, /Bài tập/]);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  const steps = page.getByRole('tabpanel').getByRole('link');
  await expect(steps).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(steps.nth(i).locator('.hv-row__no')).toHaveText(String(i + 1));
    await expect(steps.nth(i)).toContainText(`Bài 1 · Bước ${i + 1}`);
    await expect(steps.nth(i)).not.toContainText(/Đã xem|Đã học|Chưa học/);
  }
  await shot(page, 'TC-062', 1);

  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[1]!.id}`);
  await expect(page.locator('.hv-unit-head')).toContainText('Chưa có bài tập');
  await expect(page.getByRole('tab')).toHaveText([/Bài học/]);

  await page.goto(`/hv/lop/${cls.id}/bai/${l3.id}`);
  await expect(page.getByRole('heading', { name: 'Bài 3' })).toBeVisible();
  await expect(page.getByText('Bài này chưa có nội dung. Giáo viên sẽ cập nhật sau.', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await shot(page, 'TC-062', 2);

  const t0 = Date.now();
  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[3]!.id}`);
  await expect(page.getByRole('tabpanel').getByRole('link')).toHaveCount(20);
  const ms = Date.now() - t0;
  expect(ms).toBeLessThanOrEqual(3000);
  test.info().annotations.push({ type: 'NFR-3', description: `S11 with 40 items in ${ms} ms (desktop CPU, local network)` });
});
