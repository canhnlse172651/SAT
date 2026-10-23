import { test, expect } from '@playwright/test';
import { addDays, createClass, newStudent, newWorkspaceGv, seedCurriculum, setDeadline, shot, signIn, vnDay } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('[003:AC-19.4] [003:AC-19.8] TC-064 mở mọi Bài, bước, bộ theo bất kỳ thứ tự nào', async ({ page }) => {
  const gv = await newWorkspaceGv();
  const cur = await seedCurriculum(gv, 'TC-064 GT', [
    { name: 'Bài 1', steps: 2, sets: 2 },
    { name: 'Bài 2', steps: 2 },
    { name: 'Bài 3', steps: 2 },
  ]);
  const hv = await newStudent(gv, 'Châu Tự do', { activate: true });
  const cls = await createClass(gv, { name: 'TC-064 Lớp', curriculumId: cur.id, studentIds: [hv.id] });
  for (const s of cur.lessons[0]!.sets) await setDeadline(gv, cls.id, s, addDays(vnDay(), 2));
  await signIn(page, 'HV', hv.id);

  await page.goto(`/hv/lop/${cls.id}`);
  await page.locator('.hv-list a.hv-row').filter({ hasText: 'Bài 3' }).click();
  await expect(page.locator('.hv-row--next, [aria-current="true"]')).toHaveCount(0);
  await page.getByRole('link', { name: /Bài 3 · Bước 2/ }).click();
  await expect(page).toHaveURL(new RegExp(`/hv/lop/${cls.id}/buoc/${cur.lessons[2]!.steps[1]}$`));
  await shot(page, 'TC-064', 1);

  await page.goto(`/hv/lop/${cls.id}/bai/${cur.lessons[0]!.id}?tab=bai-tap`);
  await page.getByRole('link', { name: /Bài 1 · Bộ 2/ }).click();
  await expect(page).toHaveURL(new RegExp(`/bai-tap/${cur.lessons[0]!.sets[1]}$`));
  await page.goBack();
  await page.getByRole('link', { name: /Bài 1 · Bộ 1/ }).click();
  await expect(page).toHaveURL(new RegExp(`/bai-tap/${cur.lessons[0]!.sets[0]}$`));
  await shot(page, 'TC-064', 2);
});
