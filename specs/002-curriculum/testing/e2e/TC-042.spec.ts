import { test, expect } from '@playwright/test';
import { READY_STEP, addItem, addLesson, asGv, createCurriculum, publishLesson, shot, uid } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

test('[002:AC-11.1] TC-042 panel Tạo bằng AI có trên mọi Bài', async ({ page }) => {
  await asGv(page);
  const c = await createCurriculum(page, `TC-042 ${uid()}`, 1);
  const empty = await addLesson(page, c.id, 'Bài trống');
  const full = await addLesson(page, c.id, 'Bài có mục');
  const s = await addItem(page, full.id, 'lesson', { title: 'S', content: READY_STEP });
  await publishLesson(page, full.id, [s]);

  for (const [id, n] of [[empty.id, 1], [full.id, 2]] as const) {
    await page.goto(`/gv/giao-trinh/${c.id}/bai/${id}`);
    const ai = page.getByRole('region', { name: 'Tạo bằng AI' });
    await expect(ai).toBeVisible();
    await expect(ai.getByRole('heading', { name: 'Tạo bằng AI' })).toBeVisible();
    await shot(page, 'TC-042', n);
  }
});
