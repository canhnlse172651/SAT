import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, seedCurriculum, shot, signIn } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-19.9] [003:AC-23.5] TC-065 bộ chưa đặt hạn: dòng bị vô hiệu Chưa mở · Giáo viên chưa đặt hạn nộp', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-065 GT', [{ name: 'Bài 1', sets: 1, questions: 3 }]);
  const hv = await newStudent(gv, 'Diệp Chưa mở', { activate: true });
  const cls = await createClass(gv, { name: 'TC-065 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);

  const q = page.getByRole('group', { name: 'Bài 1 · Bộ 1 — Chưa mở' });
  await expect(q).toHaveAttribute('aria-disabled', 'true');
  await expect(q).toContainText('Bài 1 · Bộ 1');
  await expect(q).toContainText('3 câu');
  await expect(q).toContainText('Chưa mở');
  await expect(q).toContainText('Giáo viên chưa đặt hạn nộp');
  await expect(q).not.toContainText(/Hạn nộp|Hạn hôm nay|Quá hạn/);
  await expect(q.getByRole('link')).toHaveCount(0);
  const url = page.url();
  // The row is aria-disabled (Playwright would wait for it to be enabled): tap it anyway, then press Enter.
  await q.click({ force: true });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(url);
  await shot(page, 'TC-065', 1);
});
