import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  chooseFile,
  deck,
  evidence,
  fileBlock,
  gvPage,
  newCurriculum,
  newLesson,
  padded,
  saveStep,
  slowUploads,
} from './helpers';

test('[004:AC-6.4] TC-044 a step with a file uploading cannot be saved; other steps can', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const one = await addStep(page, les.id);
  await saveStep(page, les.id, one, 'Bước 1', {
    goal: '',
    blocks: [fileBlock('video', null), deck([{ id: 'c1', front: '你', meaning: 'bạn' }])],
  });
  await addStep(page, les.id);
  await addStep(page, les.id);
  await page.goto(T07(cur.id, les.id));
  await slowUploads(page, 1 * MB);
  const s1 = page.getByRole('region', { name: 'Bước học 1' });
  await chooseFile(page, s1.locator('.st-block').nth(0).getByRole('button', { name: 'Chọn tệp' }), {
    name: 'bai.webm',
    mimeType: 'video/webm',
    buffer: padded('webm', 40 * MB),
  });
  await expect(s1.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled();
  await expect(s1.getByRole('button', { name: 'Xuất bản' })).toBeDisabled();
  await expect(s1.getByText('Đang tải tệp lên — vui lòng đợi hoặc hủy')).toBeVisible();

  await s1.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await chooseFile(page, dialog.getByRole('button', { name: 'Hình ảnh' }), {
    name: 'the.png',
    mimeType: 'image/png',
    buffer: padded('png', 4 * MB),
  });
  await expect(dialog.getByRole('progressbar', { name: 'Tải lên the.png' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Xong' }).click();
  await expect(s1.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled();

  const s3 = page.getByRole('region', { name: 'Bước học 3' });
  await s3.getByLabel('Tên bước học').fill('Bước 3');
  await s3.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(s3.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await evidence(page, 'TC-044');
});
