import { test, expect } from '@playwright/test';
import {
  addDays,
  call,
  createClass,
  newStudent,
  newWorkspaceGv,
  ok,
  seedCurriculum,
  shot,
  signInLike,
  vnDay,
} from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-10.2] [003:AC-10.3] TC-036 lớp Sắp bắt đầu không có Kết thúc; lớp Đã kết thúc khóa thao tác', async ({
  page,
}) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-036 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const cur2 = await seedCurriculum(gv, 'TC-036 GT2', [{ name: 'Bài 1', steps: 1 }]);
  const hv = await newStudent(gv, 'Ngọc Lớp', { activate: true });
  const other = await newStudent(gv, 'Ngọc Ngoài', { activate: true });
  const upcoming = await createClass(gv, { name: 'TC-036 Sắp', curriculumId: cur.id, startDate: addDays(vnDay(), 4) });
  const ended = await createClass(gv, { name: 'TC-036 Xong', curriculumId: cur.id, studentIds: [hv.id] });
  await ok(gv, 'POST', `/classes/${ended.id}/end`);
  await signInLike(page, gv);

  await page.goto(`/gv/lop-hoc/${upcoming.id}`);
  await expect(page.getByRole('button', { name: 'Kết thúc lớp' })).toHaveCount(0);
  await expect(
    page.getByText('Lớp chưa bắt đầu — bạn có thể xóa lớp nếu không còn cần', { exact: true }),
  ).toBeVisible();
  await shot(page, 'TC-036', 1);

  await page.goto(`/gv/lop-hoc/${ended.id}`);
  await page.getByRole('button', { name: 'Sửa thông tin lớp' }).click();
  const dlg = page.getByRole('dialog', { name: 'Sửa thông tin lớp' });
  await expect(dlg.getByLabel('Ngày bắt đầu')).toBeDisabled();
  await expect(dlg.getByText('Mở lại lớp để thay đổi', { exact: true })).toBeVisible();
  await dlg.getByLabel('Tên lớp').fill('TC-036 Xong (đổi tên)');
  await dlg.getByLabel('Mô tả').fill('Đã học xong');
  await dlg.getByLabel('Lịch học').fill('Thứ 2');
  await dlg.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Đã lưu thay đổi', { exact: true })).toBeVisible();

  await expect(page.getByRole('tabpanel').getByRole('button', { name: 'Đổi giáo trình' })).toBeDisabled();
  await page.getByRole('tab', { name: /Học viên/ }).click();
  await expect(page.getByRole('tabpanel').getByText('Mở lại lớp để thay đổi', { exact: true })).toBeVisible();
  await expect(page.getByRole('tabpanel').getByRole('button', { name: 'Thêm học viên' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Gỡ khỏi lớp: Ngọc Lớp' })).toBeDisabled();
  await page.getByRole('tab', { name: 'Nội dung' }).click();
  const panel = page.getByRole('tabpanel');
  await expect(panel.getByText('Mở lại lớp để thay đổi', { exact: true })).toBeVisible();
  for (const b of await panel.getByRole('button', { name: /Ẩn|Hiện|Hạn nộp|Đặt hạn/ }).all())
    await expect(b).toBeDisabled();
  await shot(page, 'TC-036', 2);

  // The API refuses the same actions with 409.
  const lesson = cur.lessons[0]!;
  const refused = [
    await call(gv, 'PATCH', `/classes/${ended.id}`, {
      expectedVersion: (await ok(gv, 'GET', `/classes/${ended.id}`)).version,
      startDate: addDays(vnDay(), -1),
    }),
    await call(gv, 'POST', `/classes/${ended.id}/students`, { studentIds: [other.id] }),
    await call(gv, 'DELETE', `/classes/${ended.id}/students/${hv.id}`),
    await call(gv, 'PUT', `/classes/${ended.id}/curriculum`, { curriculumId: cur2.id }),
    await call(gv, 'PUT', `/classes/${ended.id}/visibility`, {
      hidden: true,
      scope: { kind: 'section', lessonId: lesson.id, section: 'lesson' },
    }),
    await call(gv, 'PUT', `/classes/${ended.id}/deadlines`, { target: { setId: lesson.sets[0] }, date: vnDay() }),
  ];
  for (const r of refused) {
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('CLASS_ENDED');
  }
});
