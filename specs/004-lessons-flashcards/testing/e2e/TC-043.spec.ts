import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  chooseFile,
  evidence,
  fileBlock,
  gvPage,
  newCurriculum,
  newLesson,
  padded,
  saveStep,
} from './helpers';

test('[004:AC-6.3] TC-043 an interrupted upload offers "Thử lại" and "Chọn tệp khác"', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Âm thanh', { goal: '', blocks: [fileBlock('audio', null)] });
  await page.goto(T07(cur.id, les.id));
  // The connection drops in the middle of the upload (first attempt only).
  let first = true;
  await page.route('**/api/steps/files?**', async (route) => {
    if (!first) return route.continue();
    first = false;
    await new Promise((r) => setTimeout(r, 1500));
    await route.abort('connectionreset');
  });
  const block = page.locator('.st-block').nth(0);
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'am.wav',
    mimeType: 'audio/wav',
    buffer: padded('wav', 8 * MB),
  });
  await expect(block.getByRole('progressbar')).toBeVisible();
  await expect(block.getByText(/^Tải lên thất bại: .+/)).toBeVisible({ timeout: 30_000 });
  await expect(block.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  await expect(block.getByRole('button', { name: 'Chọn tệp khác' })).toBeVisible();
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toHaveCount(0);
  await evidence(page, 'TC-043', 1);
  await block.getByRole('button', { name: 'Thử lại' }).click();
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toBeVisible({ timeout: 30_000 });
  await expect(block.getByText(/am\.wav · /)).toBeVisible();
  await evidence(page, 'TC-043', 2);
});
