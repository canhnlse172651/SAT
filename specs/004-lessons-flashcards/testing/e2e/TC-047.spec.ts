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
  png,
  saveStep,
  slowUploads,
  upload,
} from './helpers';

test('[004:AC-6.7] TC-047 replacing a file keeps the old one until the new one is ready', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const a = await upload(page, 'image', 'anh-A.png', png());
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Ảnh', { goal: '', blocks: [fileBlock('image', a.body)] });
  await page.goto(T07(cur.id, les.id));
  const block = page.locator('.st-block').nth(0);
  await expect(block.getByText(/anh-A\.png · /)).toBeVisible();
  await slowUploads(page, 1 * MB);
  await chooseFile(page, block.getByRole('button', { name: 'Thay tệp' }), {
    name: 'anh-B.png',
    mimeType: 'image/png',
    buffer: padded('png', 5 * MB),
  });
  await expect(block.getByRole('progressbar', { name: 'Tải lên anh-B.png' })).toBeVisible();
  await expect(block.getByText(/anh-A\.png · /)).toBeVisible();
  await evidence(page, 'TC-047', 1);
  await expect(block.getByText(/anh-B\.png · /)).toBeVisible({ timeout: 30_000 });
  await expect(block.getByText(/anh-A\.png · /)).toHaveCount(0);

  await chooseFile(page, block.getByRole('button', { name: 'Thay tệp' }), {
    name: 'anh.bmp',
    mimeType: 'image/bmp',
    buffer: Buffer.from('BM'),
  });
  await expect(
    block.getByText('Định dạng không được hỗ trợ. Khối Hình ảnh chỉ nhận: JPG/JPEG, PNG, WebP, GIF.'),
  ).toBeVisible();
  await expect(block.getByText(/anh-B\.png · /)).toBeVisible();
  await evidence(page, 'TC-047', 2);
});
