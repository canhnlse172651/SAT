import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmmyyyy, newWorkspaceGv, ok, pickDay, seedCurriculum, setDeadline, shot, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

const FAILED = 'Không thể cập nhật hạn nộp. Vui lòng thử lại.';

test('[003:AC-22.3] TC-075 cập nhật hạn thất bại: không hạn nào đổi', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-075 GT', [{ name: 'Bài 1', sets: 2 }]);
  const cls = await createClass(gv, { name: 'TC-075 Lớp', curriculumId: cur.id });
  const old = addDays(vnDay(), 3);
  await setDeadline(gv, cls.id, cur.lessons[0]!.sets[1]!, old);
  const due = addDays(vnDay(), 6);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  const fault = () => ok(gv, 'POST', '/dev/classes/faults', { op: 'deadlines' });

  await fault();
  await page.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 1: chưa đặt' }).click();
  let pop = page.getByRole('dialog', { name: 'Hạn nộp Bài 1 · Bộ 1' });
  await pickDay(pop, due);
  await pop.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText(FAILED, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 1: chưa đặt' })).toHaveText('Đặt hạn');

  await fault();
  await page.getByRole('button', { name: 'Đặt hạn cho mọi bộ của bài Bài 1: chưa đặt' }).click();
  pop = page.getByRole('dialog', { name: 'Đặt hạn cho mọi bộ của bài Bài 1' });
  await pickDay(pop, due);
  await pop.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText(FAILED, { exact: true }).first()).toBeVisible();

  await fault();
  await page.getByRole('button', { name: `Hạn nộp Bài 1 · Bộ 2: ${ddmmyyyy(old)}` }).click();
  await page.getByRole('dialog', { name: 'Hạn nộp Bài 1 · Bộ 2' }).getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText(FAILED, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: `Hạn nộp Bài 1 · Bộ 2: ${ddmmyyyy(old)}` })).toBeVisible();
  const content = await ok(gv, 'GET', `/classes/${cls.id}/content`);
  expect(content.lessons[0].sets.map((s: { deadline: string | null }) => s.deadline)).toEqual([null, old]);
  await shot(page, 'TC-075', 1);
});
