import { expect, test } from '@playwright/test';
import { T09, chooseFile, draftSet, evidence, gvPage, mcq, newCurriculum, newLesson, png, set, setBlock } from './helpers';

test('[005:AC-3.3] TC-025 a lost upload leaves the question as it was', async ({ browser }) => {
  const { page, ctx } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  await draftSet(page, les.id, 'Bộ 1', set([mcq('Đề đã nhập', [{ text: 'A', correct: true }, { text: 'B' }])]));
  await page.goto(T09(cur.id, les.id));
  const q1 = setBlock(page, 1).getByRole('region', { name: 'Câu 1', exact: true });
  await q1.getByLabel('Đề bài').fill('Đề đang soạn');

  // 1. Choose an image; the connection drops while it uploads.
  let first = true;
  await page.route('**/api/steps/files?**', async (route) => {
    if (!first) return route.continue();
    first = false;
    await ctx.setOffline(true);
    await route.abort('internetdisconnected');
  });
  await chooseFile(page, q1.getByRole('button', { name: 'Thêm ảnh đề câu 1' }), { name: 'anh.png', mimeType: 'image/png', buffer: png() });
  await expect(q1.getByText('Tải tệp lên thất bại')).toBeVisible();
  await expect(q1.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  await expect(q1.getByLabel('Đề bài')).toHaveValue('Đề đang soạn');
  await expect(q1.getByRole('img', { name: 'Hình đề câu 1' })).toHaveCount(0);
  await evidence(page, 'TC-025', 1);
  // 2. Back online, "Thử lại".
  await ctx.setOffline(false);
  await q1.getByRole('button', { name: 'Thử lại' }).click();
  await expect(q1.getByRole('img', { name: 'Hình đề câu 1' })).toBeVisible();
  await expect(q1.getByLabel('Đề bài')).toHaveValue('Đề đang soạn');
  await evidence(page, 'TC-025', 2);
});
