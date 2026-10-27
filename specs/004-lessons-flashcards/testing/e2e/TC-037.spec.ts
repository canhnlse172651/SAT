import { expect, test } from '@playwright/test';
import {
  MB,
  T07,
  addStep,
  bigPng,
  chooseFile,
  deck,
  evidence,
  fileBlock,
  gb,
  freshGvPage,
  newCurriculum,
  newLesson,
  saveStep,
  setStorage,
  text,
} from './helpers';

test('[004:AC-5.5] TC-037 used storage shown on T07 and T08, updated on upload and on release', async ({ browser }) => {
  const { page } = await freshGvPage(browser); // own workspace: storage is per workspace
  // Precondition: 3,2995 GB already used (rather than 3,25 GB) so a 2 MB image moves the figure shown to one decimal.
  await setStorage(page, gb(3.2995));
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Dung lượng', {
    goal: '',
    blocks: [text('<p>文</p>'), fileBlock('image', null), deck([{ id: 'c1', front: '你', meaning: 'bạn' }])],
  });
  await page.goto(T07(cur.id, les.id));
  const bar = page.getByRole('toolbar', { name: 'Phần Bài học' });
  await expect(bar.getByText('Đã dùng 3,2 GB / 10 GB')).toBeVisible();
  await page.getByRole('button', { name: 'Soạn bộ thẻ' }).click();
  await expect(page.getByRole('dialog').getByText('Đã dùng 3,2 GB / 10 GB')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Xong' }).click();
  await evidence(page, 'TC-037', 1);

  const block = page.locator('.st-block').nth(1);
  await chooseFile(page, block.getByRole('button', { name: 'Chọn tệp' }), {
    name: 'anh.png',
    mimeType: 'image/png',
    buffer: bigPng(2 * MB),
  });
  await expect(block.getByRole('button', { name: 'Thay tệp' })).toBeVisible();
  await expect(bar.getByText('Đã dùng 3,3 GB / 10 GB')).toBeVisible();
  const step = page.getByRole('region', { name: 'Bước học 1' });
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await evidence(page, 'TC-037', 2);

  await step.getByRole('button', { name: 'Xóa khối 2' }).click();
  await step.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(step.getByText('Chưa lưu', { exact: true })).toHaveCount(0);
  await expect(bar.getByText('Đã dùng 3,2 GB / 10 GB')).toBeVisible();
  await evidence(page, 'TC-037', 3);
  await setStorage(page, 0);
});
