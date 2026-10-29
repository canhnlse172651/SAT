import { test, expect } from '@playwright/test';
import { apiAs, createClass, hvSave, hvSubmit, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, vnDay } from './helpers';

test('[003:AC-10.4] [003:AC-10.5] TC-037 lượt dở khi lớp kết thúc: giữ, từ chối lưu/nộp, mở lại thì nộp được', async () => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-037 GT', [{ name: 'Bài 1', sets: 1, questions: 2 }]);
  const hv = await newStudent(gv, 'Quân Dở', { activate: true });
  const cls = await createClass(gv, { name: 'TC-037 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  const x = cur.lessons[0]!.sets[0]!;
  await setDeadline(gv, cls.id, x, vnDay());
  const hvApi = await apiAs('HV', hv.id);
  expect((await hvSave(hvApi, cls.id, x)).status).toBe(200);

  await ok(gv, 'POST', `/classes/${cls.id}/end`);
  const save = await hvSave(hvApi, cls.id, x);
  const submit = await hvSubmit(hvApi, cls.id, x);
  for (const r of [save, submit]) {
    expect(r.status).toBe(409);
    expect(r.body.error.message).toBe('Lớp đã kết thúc — không thể làm bài mới');
  }
  const unit = await ok(hvApi, 'GET', `/my-classes/${cls.id}/lessons/${cur.lessons[0]!.id}`);
  expect(unit.sets[0].status).toBe('doing'); // the saved attempt is kept

  const reopened = await ok(gv, 'POST', `/classes/${cls.id}/reopen`);
  expect(reopened.status).toBe('active');
  expect(reopened.endDate).toBeNull();
  const done = await hvSubmit(hvApi, cls.id, x);
  expect(done.status).toBe(200);
  const after = await ok(hvApi, 'GET', `/my-classes/${cls.id}/lessons/${cur.lessons[0]!.id}`);
  expect(after.sets[0].status).toBe('done');
});

test('[003:AC-10.4] TC-037 mở lại lớp qua T04: xác nhận và thông báo', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-037b GT', [{ name: 'Bài 1', steps: 1 }]);
  const cls = await createClass(gv, { name: 'TC-037b Lớp', curriculumId: cur.id });
  await ok(gv, 'POST', `/classes/${cls.id}/end`);
  const { signInLike, shot } = await import('./helpers');
  await signInLike(page, gv);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/gv/lop-hoc/${cls.id}`);
  await page.getByRole('button', { name: 'Mở lại lớp' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Mở lại lớp' }).click();
  await expect(page.getByText('Đã mở lại lớp', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /TC-037b Lớp/ })).toContainText('Đang học');
  await expect(page.getByRole('tabpanel')).not.toContainText('Ngày kết thúc');
  await shot(page, 'TC-037', 1);
});
