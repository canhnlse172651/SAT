import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  api,
  chooseFile,
  evidence,
  fileBlock,
  freshGvPage,
  newCurriculum,
  newLesson,
  padded,
  saveStep,
  setStorage,
  slowUploads,
  text,
} from './helpers';

test('[004:AC-6.1] [004:AC-6.2] TC-042 upload progress, editing meanwhile, cancel', async ({ browser }) => {
  const { page } = await freshGvPage(browser); // own workspace: storage is per workspace
  await setStorage(page, 0);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Video', { goal: '', blocks: [fileBlock('video', null), text('<p>chữ</p>')] });
  await page.goto(T07(cur.id, les.id));
  await slowUploads(page, 1 * MB);
  const block = page.locator('.st-block').nth(0);
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'bai giang.webm',
    mimeType: 'video/webm',
    buffer: padded('webm', 30 * MB),
  });
  const bar = block.getByRole('progressbar', { name: 'Tải lên bai giang.webm' });
  await expect(bar).toBeVisible();
  await expect(block.getByText('bai giang.webm')).toBeVisible();
  await expect(block.getByRole('button', { name: 'Hủy' })).toBeVisible();
  const p1 = Number(await bar.getAttribute('aria-valuenow'));
  await page.waitForTimeout(1500);
  const p2 = Number(await bar.getAttribute('aria-valuenow'));
  expect(p2).toBeGreaterThan(p1);
  // Other blocks stay editable.
  const other = page.getByRole('textbox', { name: 'Nội dung khối 2' });
  await other.click();
  await other.pressSequentially(' thêm');
  await expect(other).toContainText('chữ thêm');
  await evidence(page, 'TC-042', 1);
  await block.getByRole('button', { name: 'Hủy' }).click();
  await expect(bar).toHaveCount(0);
  await expect(block.getByRole('button', { name: 'Chọn tệp' })).toBeVisible();
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toHaveCount(0);
  expect((await api<{ usedBytes: number }>(page, 'GET', '/api/steps/storage')).usedBytes).toBe(0);
  await evidence(page, 'TC-042', 2);
});
