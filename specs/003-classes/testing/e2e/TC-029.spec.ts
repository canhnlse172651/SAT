import { test, expect } from '@playwright/test';
import { call, createClass, newWorkspaceGv, ok, seedCurriculum, shot, signInLike, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[003:AC-8.4] [003:AC-8.3] TC-029 giới hạn 100 khi thêm đồng thời, không trùng thành viên', async ({ page }) => {
  test.setTimeout(240_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-029 GT', [{ name: 'Bài 1', steps: 1 }]);
  const mk = async (n: number, prefix = 'S') =>
    Promise.all(
      Array.from({ length: n }, async (_, i) =>
        (await ok(gv, 'POST', '/students', { displayName: `${prefix} ${i} ${uid()}`, email: `s${i}+${uid()}@x.dev` })).id as string,
      ),
    );
  const base = [...(await mk(49)), ...(await mk(49))];
  const extra = await mk(4, 'Thêm');
  const cls = await createClass(gv, { name: 'TC-029 Lớp', curriculumId: cur.id, studentIds: base });

  const [r1, r2] = await Promise.all([
    call(gv, 'POST', `/classes/${cls.id}/students`, { studentIds: extra.slice(0, 2) }),
    call(gv, 'POST', `/classes/${cls.id}/students`, { studentIds: extra.slice(2, 4) }),
  ]);
  const detail = await ok(gv, 'GET', `/classes/${cls.id}`);
  // 98 + 2 + 2 does not fit: one request adds its 2, the other adds nobody.
  expect(detail.memberCount).toBeLessThanOrEqual(100);
  expect([r1.status, r2.status].sort()).toEqual([200, 409]);
  expect(detail.memberCount).toBe(100);
  expect([r1, r2].find((r) => r.status === 409)!.body.error.message).toBe(
    'Lớp chỉ còn chỗ cho 0 học viên (tối đa 100)',
  );

  // A class with 98: adding 3 adds nobody.
  const cls2 = await createClass(gv, { name: 'TC-029 Lớp 98', curriculumId: cur.id, studentIds: base });
  const r3 = await call(gv, 'POST', `/classes/${cls2.id}/students`, { studentIds: extra.slice(0, 3) });
  expect(r3.status).toBe(409);
  expect(r3.body.error.message).toBe('Lớp chỉ còn chỗ cho 2 học viên (tối đa 100)');
  expect((await ok(gv, 'GET', `/classes/${cls2.id}`)).memberCount).toBe(98);
  await signInLike(page, gv);
  await page.goto(`/gv/lop-hoc/${cls2.id}?tab=hoc-vien`);
  await page.getByRole('tabpanel').getByRole('button', { name: 'Thêm học viên' }).click();
  const dlg = page.getByRole('dialog', { name: 'Thêm học viên' });
  await dlg.getByLabel('Tìm học viên').fill('Thêm');
  const boxes = dlg.getByRole('group', { name: 'Học viên trong workspace' }).getByRole('checkbox');
  await expect(boxes.first()).toBeVisible();
  // The dialog lets the GV pick only the seats left; the 3rd pick shows the server's wording.
  const free = dlg
    .getByRole('group', { name: 'Học viên trong workspace' })
    .getByRole('checkbox', { disabled: false });
  await free.nth(0).check();
  await free.nth(1).check();
  await free.nth(2).click();
  await expect(dlg.getByText('Lớp chỉ còn chỗ cho 2 học viên (tối đa 100)', { exact: true })).toBeVisible();
  await shot(page, 'TC-029', 1);

  // The same student added by two concurrent requests ends up a member once.
  const cls3 = await createClass(gv, { name: 'TC-029 Lớp 3', curriculumId: cur.id });
  await Promise.all([
    call(gv, 'POST', `/classes/${cls3.id}/students`, { studentIds: [extra[3]] }),
    call(gv, 'POST', `/classes/${cls3.id}/students`, { studentIds: [extra[3]] }),
  ]);
  const members = await ok(gv, 'GET', `/classes/${cls3.id}/students`);
  expect(members.items.filter((m: { id: string }) => m.id === extra[3])).toHaveLength(1);
  expect(members.memberCount).toBe(1);
});
