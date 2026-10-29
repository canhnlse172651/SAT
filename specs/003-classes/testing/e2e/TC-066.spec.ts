import { test, expect } from '@playwright/test';
import { createClass, newStudent, newWorkspaceGv, ok, seedCurriculum, shot, signIn, uid } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-20.1] [003:AC-20.2] [003:AC-20.5] [003:NFR-3] TC-066 Thành viên (4): mình đứng đầu "Bạn", A→Z, mở S12 / S10; 100 HV ≤ 3 giây', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-066 GT', [{ name: 'Bài 1', steps: 1 }]);
  const dung = await newStudent(gv, 'Dũng', { activate: true });
  const an = await newStudent(gv, 'An', { activate: true });
  const chi = await newStudent(gv, 'Chi', { activate: true });
  const binh = await newStudent(gv, 'Bình', { activate: true });
  const em = await newStudent(gv, 'Em');
  const cls = await createClass(gv, {
    name: 'TC-066 Lớp',
    curriculumId: cur.id,
    studentIds: [dung.id, an.id, chi.id, binh.id, em.id],
  });
  await signIn(page, 'HV', chi.id);
  await page.goto(`/hv/lop/${cls.id}`);
  await expect(page.getByRole('button', { name: /Thành viên \(4\)/ })).toBeVisible();
  await page.getByRole('button', { name: /Thành viên \(4\)/ }).click();

  const rows = page.locator('.hv-list a.hv-row');
  await expect(rows).toHaveCount(4);
  await expect(rows.locator('.hv-row__title')).toHaveText(['Chi', 'An', 'Bình', 'Dũng']);
  await expect(rows.nth(0)).toContainText('Bạn');
  for (const n of ['Chi', 'An', 'Bình', 'Dũng']) await expect(page.getByRole('img', { name: n })).toBeVisible();
  await expect(page.getByText('Em', { exact: true })).toHaveCount(0);
  await shot(page, 'TC-066', 1);

  await rows.nth(2).click();
  await expect(page).toHaveURL(new RegExp(`/hv/hoc-vien/${binh.id}$`));
  await page.goBack();
  await rows.nth(0).click();
  await expect(page).toHaveURL(/\/hv\/ho-so$/);

  // NFR-3: the members list of a class of 100 HV.
  const ids = [chi.id];
  for (let i = 0; i < 99; i += 33)
    ids.push(
      ...(await Promise.all(
        Array.from({ length: Math.min(33, 99 - i) }, async (_, k) => {
          const s = await ok(gv, 'POST', '/students', { displayName: `Bạn ${i + k}`, email: `m${i + k}+${uid()}@x.dev` });
          await ok(gv, 'POST', `/students/${s.id}/activate`, {});
          return s.id as string;
        }),
      )),
    );
  const big = await createClass(gv, { name: 'TC-066 100', curriculumId: cur.id, studentIds: ids });
  await expect
    .poll(async () => (await ok(gv, 'GET', `/classes/${big.id}/tracked-students`)).items.length, { timeout: 60_000 })
    .toBe(100);
  const t0 = Date.now();
  await page.goto(`/hv/lop/${big.id}?xem=thanh-vien`);
  await expect(rows).toHaveCount(100);
  const ms = Date.now() - t0;
  expect(ms).toBeLessThanOrEqual(3000);
  test.info().annotations.push({ type: 'NFR-3', description: `members list of 100 in ${ms} ms (desktop CPU, local network)` });
});
