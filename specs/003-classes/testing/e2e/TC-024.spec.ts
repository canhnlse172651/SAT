import { test, expect } from '@playwright/test';
import { addDays, apiAs, createClass, ddmmyyyy, seedCurriculum, setVisibility, shot, signIn, uid, vnDay } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-7.1] [003:AC-7.2] TC-024 T04 phần đầu, 5 tab, tab Tổng quan và thẻ giáo trình', async ({ page }) => {
  const gv = await apiAs('GV');
  const cur = await seedCurriculum(gv, `TC-024 GT ${uid()}`, [
    { name: 'Bài 1', steps: 1 },
    { name: 'Bài 2', steps: 1 },
    { name: 'Bài 3', steps: 1 },
  ], 4);
  const start = addDays(vnDay(), -2);
  const name = `TC-024 Lớp ${uid()}`;
  const cls = await createClass(gv, {
    name,
    curriculumId: cur.id,
    startDate: start,
    description: 'Lớp tối',
    schedule: 'Thứ 3, 5 — 19:00',
  });
  await setVisibility(gv, cls.id, true, { kind: 'section', lessonId: cur.lessons[0]!.id, section: 'lesson' });
  await signIn(page, 'GV');
  await page.goto(`/gv/lop-hoc/${cls.id}`);

  await expect(page.getByRole('heading', { name: new RegExp(name) })).toContainText('Đang học');
  const sub = page.locator('.page-sub');
  await expect(sub).toContainText(`Bắt đầu ${ddmmyyyy(start)}`);
  await expect(sub).toContainText('HSK4');
  await expect(sub.getByRole('link', { name: cur.name })).toBeVisible();
  await expect(sub).toContainText('Sĩ số 0/100');
  await expect(page.getByRole('button', { name: 'Sửa thông tin lớp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kết thúc lớp' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveText([/Tổng quan/, /Học viên/, /Nội dung/, /Tiến độ/, /Xếp hạng/]);
  await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
  const panel = page.getByRole('tabpanel');
  await expect(panel).toContainText('Lớp tối');
  await expect(panel).toContainText('Thứ 3, 5 — 19:00');
  await expect(panel).toContainText(`Ngày tạo${ddmmyyyy(vnDay())}`);
  await expect(panel).toContainText('3 bài đã xuất bản · 1 phần đang ẩn với lớp');
  await expect(panel.getByRole('button', { name: 'Đổi giáo trình' })).toBeVisible();
  await shot(page, 'TC-024', 1);

  await sub.getByRole('link', { name: cur.name }).click();
  await expect(page).toHaveURL(new RegExp(`/gv/giao-trinh/${cur.id}$`));
  await page.goBack();
  await page.getByRole('button', { name: 'Xem tab Nội dung' }).click();
  await expect(page.getByRole('tab', { name: 'Nội dung' })).toHaveAttribute('aria-selected', 'true');
  await shot(page, 'TC-024', 2);
});
