import { test, expect } from '@playwright/test';
import { addDays, createClass, ddmm, ddmmyyyy, newStudent, newWorkspaceGv, pickDay, seedCurriculum, shot, signIn, signInLike, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-21.3] [003:AC-21.6] TC-071 đặt hạn bằng Áp dụng, xóa hạn bằng Xóa', async ({ page, browser }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-071 GT', [{ name: 'Bài 1', sets: 1 }]);
  const hv = await newStudent(gv, 'Đào Hạn', { activate: true });
  const cls = await createClass(gv, { name: 'TC-071 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  const due = addDays(vnDay(), 7);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls.id}?tab=noi-dung`);
  const hvPage = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await signIn(hvPage, 'HV', hv.id);

  await page.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 1: chưa đặt' }).click();
  const pop = page.getByRole('dialog', { name: 'Hạn nộp Bài 1 · Bộ 1' });
  await expect(pop.getByText('Chọn ngày hạn nộp', { exact: true })).toBeVisible();
  await pickDay(pop, due);
  await pop.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(pop).toBeHidden();
  await expect(page.getByRole('button', { name: `Hạn nộp Bài 1 · Bộ 1: ${ddmmyyyy(due)}` })).toHaveText(ddmmyyyy(due));
  await expect(
    page.getByText(`Đã đặt hạn nộp 23:59 ${ddmmyyyy(due)}. Nhắc học viên chưa làm lúc 08:00 ngày hạn.`, { exact: true }),
  ).toBeVisible();
  await shot(page, 'TC-071', 1);
  await hvPage.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  const set = hvPage.getByRole('link', { name: /Bài 1 · Bộ 1/ });
  await expect(set).toContainText(`Hạn nộp ${ddmm(due)}`);
  await expect(set).toContainText('Chưa làm');

  await page.getByRole('button', { name: `Hạn nộp Bài 1 · Bộ 1: ${ddmmyyyy(due)}` }).click();
  await pop.getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(pop).toBeHidden();
  await expect(page.getByRole('button', { name: 'Hạn nộp Bài 1 · Bộ 1: chưa đặt' })).toHaveText('Đặt hạn');
  await expect(
    page.getByText('Đã xóa hạn nộp. Bộ bài tập chuyển sang “Chưa mở” với học viên.', { exact: true }),
  ).toBeVisible();
  await hvPage.reload();
  await expect(hvPage.getByRole('group', { name: 'Bài 1 · Bộ 1 — Chưa mở' })).toBeVisible();
  await shot(hvPage, 'TC-071', 2);
});
