import { test, expect } from '@playwright/test';
import { apiAs, createClass, hvSubmit, newStudent, newWorkspaceGv, ok, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

const REFUSED = 'Bạn không thuộc lớp này hoặc lớp không còn tồn tại';

test('[003:AC-14.5] [003:AC-20.7] TC-049 HV bị gỡ / lớp bị xóa: từ chối, thông báo, về S01', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-049 GT', [{ name: 'Bài 1', steps: 1, sets: 1 }]);
  const hv = await newStudent(gv, 'Quỳnh Rời', { activate: true });
  const a = await createClass(gv, { name: 'TC-049 A', curriculumId: cur.id, studentIds: [hv.id] });
  const b = await createClass(gv, { name: 'TC-049 B', curriculumId: cur.id, studentIds: [hv.id] });
  const setId = cur.lessons[0]!.sets[0]!;
  await setDeadline(gv, a.id, setId, vnDay());
  await signIn(page, 'HV', hv.id);
  await page.goto(`/hv/lop/${a.id}/bai/${cur.lessons[0]!.id}`);
  await expect(page.getByRole('heading', { name: 'Bài 1' })).toBeVisible();

  await ok(gv, 'DELETE', `/classes/${a.id}/students/${hv.id}`);
  await page.getByRole('tab', { name: /Bài tập/ }).click();
  await page.reload();
  await expect(page.getByText(REFUSED, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/hv$/);
  await shot(page, 'TC-049', 1);

  await page.goto(`/hv/lop/${a.id}?xem=thanh-vien`);
  await expect(page.getByText(REFUSED, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/hv$/);
  const hvApi = await apiAs('HV', hv.id);
  const members = await (async () => (await import('./helpers')).call(hvApi, 'GET', `/my-classes/${a.id}/members`))();
  expect(members.status).toBe(404);
  expect(members.body.error.message).toBe(REFUSED);
  expect(JSON.stringify(members.body)).not.toContain('Quỳnh');
  const submit = await hvSubmit(hvApi, a.id, setId);
  expect(submit.status).toBe(404);
  expect(submit.body.error.message).toBe(REFUSED);

  await ok(gv, 'DELETE', `/classes/${b.id}`);
  await page.goto(`/hv/lop/${b.id}`);
  await expect(page.getByText(REFUSED, { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/hv$/);
  await shot(page, 'TC-049', 2);
});
