import { test, expect } from '@playwright/test';
import { addLesson, aiLabel, asGv, createCurriculum, lessonRow, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-11.4] TC-043 bấm nhãn AI: chờ duyệt → T20, đang tạo → panel Tạo bằng AI của T18', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-043 ${uid()}`, 1);
  const a = await addLesson(page, c.id, 'Bài A');
  const b = await addLesson(page, c.id, 'Bài B');
  await aiLabel(page, a.id, 'review');
  await aiLabel(page, b.id, 'generating', 10);

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài A').getByRole('button', { name: 'AI · Chờ duyệt' }).click();
  await expect(page).toHaveURL(new RegExp(`/bai/${a.id}/review-ai$`));

  await page.goto(`/gv/giao-trinh/${c.id}`);
  await lessonRow(page, 'Bài B').getByRole('button', { name: 'AI · Đang tạo 10%' }).click();
  await expect(page).toHaveURL(new RegExp(`/bai/${b.id}#tao-bang-ai$`));
  await expect(page.getByRole('region', { name: 'Tạo bằng AI' })).toBeFocused();
  await shot(page, 'TC-043', 1);

  await page.goto(`/gv/giao-trinh/${c.id}/bai/${a.id}`);
  await page.getByRole('button', { name: 'AI · Chờ duyệt' }).click();
  await expect(page).toHaveURL(new RegExp(`/bai/${a.id}/review-ai$`));
});
