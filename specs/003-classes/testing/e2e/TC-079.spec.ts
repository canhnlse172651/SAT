import { test, expect } from '@playwright/test';
import { addDays, apiAs, createClass, ddmm, hvSubmit, newStudent, newWorkspaceGv, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-23.7] [003:NFR-4] TC-079 đặt / xóa hạn có hiệu lực với HV trong ≤ 5 giây', async ({ page, browser }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-079 GT', [{ name: 'Bài 1', sets: 1, questions: 2 }]);
  const p = cur.lessons[0]!.sets[0]!;
  const hv1 = await newStudent(gv, 'Khang Chưa nộp', { activate: true });
  const hv2 = await newStudent(gv, 'Khang Đã nộp', { activate: true });
  const cls = await createClass(gv, { name: 'TC-079 Lớp', curriculumId: cur.id, studentIds: [hv1.id, hv2.id] });
  const due = addDays(vnDay(), 5);
  await signIn(page, 'HV', hv1.id);
  const url = `/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`;
  await page.goto(url);
  await expect(page.getByRole('group', { name: 'Bài 1 · Bộ 1 — Chưa mở' })).toBeVisible();

  await setDeadline(gv, cls.id, p, due);
  const t0 = Date.now();
  await page.reload();
  const row = page.getByRole('link', { name: /Bài 1 · Bộ 1/ });
  await expect(row).toContainText(`Hạn nộp ${ddmm(due)}`);
  await expect(row).toContainText('Chưa làm');
  expect(Date.now() - t0).toBeLessThanOrEqual(5000);
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/bai-tap/${p}$`));
  expect((await hvSubmit(await apiAs('HV', hv2.id), cls.id, p, 2, 2)).status).toBe(200);
  await shot(page, 'TC-079', 1);

  await setDeadline(gv, cls.id, p, null);
  await page.goto(url);
  await expect(page.getByRole('group', { name: 'Bài 1 · Bộ 1 — Chưa mở' })).toBeVisible();
  const page2 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await signIn(page2, 'HV', hv2.id);
  await page2.goto(url);
  const done = page2.getByRole('link', { name: /Bài 1 · Bộ 1/ });
  await expect(done).toContainText('Đã hoàn thành · 2/2');
  await done.click();
  await expect(page2).toHaveURL(new RegExp(`/bai-tap/${p}/ket-qua$`));
  await shot(page2, 'TC-079', 2);
});
