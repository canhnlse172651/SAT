import { closeSync, openSync, ftruncateSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { MB, T07, addStep, bigPng, chooseFile, evidence, fileBlock, gvPage, newCurriculum, newLesson, saveStep } from './helpers';

test('[004:AC-5.3] TC-035 files over the limit of their block are refused before upload', async ({ browser }) => {
  const { page } = await gvPage(browser);
  const cur = await newCurriculum(page);
  const les = await newLesson(page, cur.id);
  const id = await addStep(page, les.id);
  await saveStep(page, les.id, id, 'Tệp lớn', { goal: '', blocks: [fileBlock('image', null), fileBlock('video', null)] });
  await page.goto(T07(cur.id, les.id));
  const uploads: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/steps/files')) uploads.push(r.url());
  });
  const block = (n: number) => page.locator('.st-block').nth(n);
  await chooseFile(page, block(0).getByRole('button', { name: 'Chọn tệp' }), {
    name: 'ảnh 茶.png',
    mimeType: 'image/png',
    buffer: bigPng(11 * MB),
  });
  await expect(block(0).getByText('Tệp ảnh 茶.png (11 MB) vượt quá giới hạn 10 MB của khối Hình ảnh.')).toBeVisible();

  // A 600 MB video, written to disk (sparse) so the browser reads it from a path.
  const dir = mkdtempSync(join(tmpdir(), 'qa004-'));
  const path = join(dir, 'bai.mp4');
  const fd = openSync(path, 'w');
  ftruncateSync(fd, 600 * MB);
  closeSync(fd);
  try {
    const chooser = page.waitForEvent('filechooser');
    await block(1).getByRole('button', { name: 'Chọn tệp' }).click();
    await (await chooser).setFiles(path);
    await expect(block(1).getByText('Tệp bai.mp4 (600 MB) vượt quá giới hạn 500 MB của khối Video.')).toBeVisible();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  expect(uploads).toEqual([]);
  await evidence(page, 'TC-035');
});
